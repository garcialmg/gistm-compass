import Anthropic from "@anthropic-ai/sdk";
import { prisma } from "@/lib/prisma";
import { tokenize, overlapScore } from "@/lib/ai-simulator";

/**
 * Núcleo agêntico de conhecimento documental.
 *
 * Diferente da primeira geração (RAG de trecho único: rankeava por palavra-chave,
 * mandava os 6 melhores trechos truncados e a IA só via aquilo), aqui a IA tem
 * ACESSO COMPLETO à base documental da instalação através de ferramentas que ela
 * mesma decide quando usar, num laço agêntico:
 *
 *   localizar → consultar → compreender → cruzar → comparar → avaliar → responder
 *
 * A arquitetura separa RECUPERAÇÃO RÁPIDA (onde está a informação) de ACESSO AO
 * CONTEÚDO INTEGRAL (ler o documento inteiro quando a resposta depende dele):
 *
 *   - `listar_documentos`  → índice de tudo que existe (visão geral)
 *   - `buscar`             → recuperação rápida: onde uma informação aparece
 *   - `ler_documento`      → conteúdo integral de um documento, paginado
 *
 * A busca serve para encontrar rápido; ela NUNCA limita o conhecimento da IA aos
 * trechos retornados — a IA pode sempre abrir o documento inteiro. Nenhuma
 * informação relevante é descartada por não ter aparecido no primeiro resultado.
 */

const MODEL = "claude-sonnet-5";
const MAX_TURNS = 16; // teto de segurança do laço agêntico
const READ_PAGE_CHARS = 20000; // tamanho de cada página ao ler um documento
const SEARCH_SNIPPET_CHARS = 500;
const MAX_SEARCH_HITS = 12;

export class AiAgentNotConfiguredError extends Error {}

type DocRow = {
  id: string;
  title: string;
  type: string;
  extractedText: string | null;
};

export interface AgentSource {
  documentId: string;
  title: string;
  type: string;
}

export interface AgentRunResult {
  answer: string;
  sources: AgentSource[]; // documentos que a IA efetivamente abriu/consultou
  turns: number;
  // Quando um `finalTool` é fornecido e a IA o chama, o input (JSON já validado
  // pela API — sem parsing frágil) vem aqui e o laço encerra.
  finalToolInput?: Record<string, unknown>;
}

/**
 * Ferramenta terminal opcional: quando a IA a chama, o laço encerra e o input
 * dela (validado pela própria API, `strict: true`) é devolvido em
 * `finalToolInput`. Usado pela avaliação para receber o veredito como JSON
 * garantido, em vez de tentar fazer JSON.parse de texto livre.
 */
export interface FinalTool {
  name: string;
  description: string;
  input_schema: Anthropic.Tool.InputSchema;
}

// ---------------------------------------------------------------------------
// Ferramentas expostas à IA
// ---------------------------------------------------------------------------

const TOOLS: Anthropic.Tool[] = [
  {
    name: "listar_documentos",
    description:
      "Lista TODOS os documentos da instalação (índice completo): id, título, tipo e tamanho. " +
      "Use no início para ter a visão geral do que existe antes de concluir que algo não foi " +
      "encontrado. Não retorna o conteúdo — use ler_documento para isso.",
    input_schema: { type: "object", properties: {}, additionalProperties: false },
  },
  {
    name: "buscar",
    description:
      "Recuperação rápida: encontra ONDE um termo aparece na base documental inteira, retornando " +
      "trechos curtos com o documento e a posição. Use para localizar candidatos. IMPORTANTE: a " +
      "busca é por palavras — tente sinônimos e termos equivalentes, e não conclua que algo não " +
      "existe só porque uma busca não retornou; confirme abrindo os documentos relacionados com " +
      "ler_documento.",
    input_schema: {
      type: "object",
      properties: {
        consulta: { type: "string", description: "Termos a procurar (pode conter vários)." },
      },
      required: ["consulta"],
      additionalProperties: false,
    },
  },
  {
    name: "ler_documento",
    description:
      "Acesso ao CONTEÚDO INTEGRAL de um documento. Retorna o texto do documento em páginas de " +
      `~${READ_PAGE_CHARS} caracteres. Use 'pagina' para avançar quando o documento for maior que ` +
      "uma página (a resposta indica se há mais). Sempre que a conclusão depender do contexto " +
      "completo, leia o documento inteiro, não apenas um trecho.",
    input_schema: {
      type: "object",
      properties: {
        documentId: { type: "string", description: "id do documento (de listar_documentos ou buscar)." },
        pagina: { type: "integer", description: "Página a ler, começando em 1. Padrão: 1." },
      },
      required: ["documentId"],
      additionalProperties: false,
    },
  },
];

// ---------------------------------------------------------------------------
// Execução das ferramentas (lado servidor, determinístico)
// ---------------------------------------------------------------------------

function runListar(docs: DocRow[]): string {
  if (docs.length === 0) return "Não há documentos enviados para esta instalação.";
  const linhas = docs.map((d) => {
    const chars = d.extractedText?.length ?? 0;
    const paginas = chars > 0 ? Math.ceil(chars / READ_PAGE_CHARS) : 0;
    const nota = chars === 0 ? " [sem texto extraído — indexado só por título/metadados]" : ` (${chars} caract., ${paginas} pág.)`;
    return `- id=${d.id} | tipo: ${d.type} | "${d.title}"${nota}`;
  });
  return `${docs.length} documento(s) na instalação:\n${linhas.join("\n")}`;
}

function runBuscar(docs: DocRow[], consulta: string): string {
  const tokens = tokenize(consulta);
  const comTexto = docs.filter((d) => d.extractedText && d.extractedText.trim());
  const scored = comTexto
    .map((d) => ({ d, score: overlapScore(tokens, d.extractedText!) }))
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score);

  if (scored.length === 0) {
    return (
      `Nenhum documento pontuou para "${consulta}" na busca por palavras-chave. ` +
      "Isso NÃO significa que a informação não existe — tente sinônimos, ou use listar_documentos " +
      "e abra com ler_documento os documentos cujo tipo/título sejam relacionados."
    );
  }

  // termos individuais para localizar o trecho dentro do documento
  const termos = [...tokens];
  const blocos: string[] = [];
  for (const { d, score } of scored.slice(0, MAX_SEARCH_HITS)) {
    const texto = d.extractedText!;
    const baixo = texto.toLowerCase();
    let pos = -1;
    for (const t of termos) {
      const p = baixo.indexOf(t);
      if (p >= 0 && (pos < 0 || p < pos)) pos = p;
    }
    const ini = pos < 0 ? 0 : Math.max(0, pos - 120);
    const trecho = texto.slice(ini, ini + SEARCH_SNIPPET_CHARS).replace(/\s+/g, " ").trim();
    const posInfo = pos < 0 ? "" : ` (por volta do caractere ${ini}, pág. ~${Math.floor(ini / READ_PAGE_CHARS) + 1})`;
    blocos.push(
      `[id=${d.id}] "${d.title}" (relevância ${(score * 100).toFixed(0)}%)${posInfo}\n…${trecho}…`
    );
  }
  return (
    `Trechos onde "${consulta}" aparece (recuperação rápida — abra o documento inteiro com ` +
    `ler_documento para o contexto completo):\n\n${blocos.join("\n\n")}`
  );
}

function runLer(docs: DocRow[], documentId: string, pagina: number): string {
  const doc = docs.find((d) => d.id === documentId);
  if (!doc) return `Documento id=${documentId} não encontrado nesta instalação. Use listar_documentos.`;
  const texto = doc.extractedText ?? "";
  if (!texto.trim()) {
    return `O documento "${doc.title}" (tipo ${doc.type}) existe, mas não tem texto extraído (formato sem extração ou PDF escaneado). A EXISTÊNCIA do documento é, por si só, uma evidência.`;
  }
  const totalPaginas = Math.max(1, Math.ceil(texto.length / READ_PAGE_CHARS));
  const p = Math.min(Math.max(1, Math.floor(pagina) || 1), totalPaginas);
  const fatia = texto.slice((p - 1) * READ_PAGE_CHARS, p * READ_PAGE_CHARS);
  const cabecalho = `"${doc.title}" (tipo ${doc.type}) — página ${p}/${totalPaginas}`;
  const rodape =
    p < totalPaginas
      ? `\n\n[continua — há mais ${totalPaginas - p} página(s); chame ler_documento com pagina=${p + 1} para prosseguir]`
      : "\n\n[fim do documento]";
  return `${cabecalho}\n\n${fatia}${rodape}`;
}

// ---------------------------------------------------------------------------
// Laço agêntico
// ---------------------------------------------------------------------------

/**
 * Roda o laço agêntico até a IA parar de chamar ferramentas (resposta final) ou
 * atingir o teto de turnos. `system` e a primeira mensagem `user` são fornecidos
 * por quem chama (chat ou avaliação); as ferramentas e o laço são compartilhados.
 */
export async function runDocumentAgent(
  installationId: string,
  system: string,
  userPrompt: string,
  opts?: { maxTokens?: number; finalTool?: FinalTool; forceFirstTool?: string },
): Promise<AgentRunResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new AiAgentNotConfiguredError(
      "ANTHROPIC_API_KEY não configurada — a leitura por IA precisa dessa chave."
    );
  }

  const docs: DocRow[] = await prisma.documentFile.findMany({
    where: { installationId },
    select: { id: true, title: true, type: true, extractedText: true },
    orderBy: { uploadedAt: "desc" },
  });

  const tools: Anthropic.Tool[] = opts?.finalTool
    ? [...TOOLS, { ...opts.finalTool, strict: true } as Anthropic.Tool]
    : TOOLS;

  const client = new Anthropic({ apiKey });
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: userPrompt }];
  const consultados = new Map<string, AgentSource>();
  let turns = 0;

  while (turns < MAX_TURNS) {
    turns++;
    // No 1º turno, opcionalmente força uma ferramenta (ex.: listar_documentos)
    // para garantir que a IA comece consultando a base, em vez de responder de
    // cabeça sem ler nada.
    const toolChoice: Anthropic.MessageCreateParams["tool_choice"] | undefined =
      turns === 1 && opts?.forceFirstTool
        ? { type: "tool", name: opts.forceFirstTool }
        : undefined;
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: opts?.maxTokens ?? 2048,
      system,
      tools,
      ...(toolChoice ? { tool_choice: toolChoice } : {}),
      messages,
    });

    // A IA chamou a ferramenta terminal → devolve o input validado e encerra.
    if (opts?.finalTool) {
      const finalCall = response.content.find(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use" && b.name === opts.finalTool!.name
      );
      if (finalCall) {
        return {
          answer: "",
          sources: [...consultados.values()],
          turns,
          finalToolInput: (finalCall.input ?? {}) as Record<string, unknown>,
        };
      }
    }

    if (response.stop_reason !== "tool_use") {
      const answer = response.content
        .filter((b): b is Anthropic.TextBlock => b.type === "text")
        .map((b) => b.text)
        .join("\n")
        .trim();
      return { answer, sources: [...consultados.values()], turns };
    }

    // Executa cada ferramenta pedida e devolve todos os resultados num único turno
    messages.push({ role: "assistant", content: response.content });
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      const input = (block.input ?? {}) as Record<string, unknown>;
      let resultText: string;
      try {
        if (block.name === "listar_documentos") {
          resultText = runListar(docs);
        } else if (block.name === "buscar") {
          resultText = runBuscar(docs, String(input.consulta ?? ""));
        } else if (block.name === "ler_documento") {
          const id = String(input.documentId ?? "");
          resultText = runLer(docs, id, Number(input.pagina ?? 1));
          const doc = docs.find((d) => d.id === id);
          if (doc) consultados.set(doc.id, { documentId: doc.id, title: doc.title, type: doc.type });
        } else {
          resultText = `Ferramenta desconhecida: ${block.name}`;
        }
      } catch (err) {
        resultText = `Erro ao executar ${block.name}: ${(err as Error).message}`;
      }
      toolResults.push({ type: "tool_result", tool_use_id: block.id, content: resultText });
    }
    messages.push({ role: "user", content: toolResults });
  }

  // Atingiu o teto — pede uma resposta final sem mais ferramentas
  const fecho = await client.messages.create({
    model: MODEL,
    max_tokens: opts?.maxTokens ?? 2048,
    system,
    messages: [
      ...messages,
      {
        role: "user",
        content:
          "Você atingiu o limite de consultas. Responda agora com base em tudo que já leu, " +
          "deixando claro o que ficou sem verificar.",
      },
    ],
  });
  const answer = fecho.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
  return { answer, sources: [...consultados.values()], turns };
}
