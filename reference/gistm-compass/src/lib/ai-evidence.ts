import { prisma } from "@/lib/prisma";
import type {
  EvidenceRobustness,
  FinalClassification,
  GapCriticality,
  InfoSufficiency,
  Requirement,
} from "@prisma/client";
import { runDocumentAgent, AiAgentNotConfiguredError } from "@/lib/ai-agent";

/**
 * Avaliação de conformidade com IA real (Claude), agora sobre o núcleo agêntico
 * (`ai-agent.ts`). Em vez de julgar a partir de 6 trechos truncados escolhidos
 * por palavra-chave, a IA tem acesso à base documental inteira: localiza,
 * consulta o conteúdo integral, cruza documentos e só então classifica.
 *
 * Critérios menos rígidos: a existência de um documento esperado já é evidência
 * positiva e pode significar atendimento parcial — a IA não classifica como
 * "não atende" só porque o conteúdo não comprova tudo. E não conclui ausência
 * de forma precipitada: verifica documentos relacionados e termos equivalentes
 * antes de dizer que não localizou.
 *
 * Qualquer falha (sem chave, erro, JSON inválido, enum fora do esperado) retorna
 * null — quem chamou cai de volta para a heurística determinística.
 */

const VALID_CLASSIFICATION: ReadonlySet<string> = new Set([
  "ATENDE_TOTALMENTE",
  "ATENDE_PARCIALMENTE",
  "NAO_ATENDE",
  "NAO_SE_APLICA",
]);
const VALID_ROBUSTNESS: ReadonlySet<string> = new Set(["ROBUSTA", "PARCIAL", "FRACA", "AUSENTE"]);
const VALID_CRITICALITY: ReadonlySet<string> = new Set(["ALTA", "MEDIA", "BAIXA", "NAO_SE_APLICA"]);
const VALID_INFO_SUFFICIENCY: ReadonlySet<string> = new Set(["SUFICIENTE", "INSUFICIENTE"]);

export interface RealAiAssessment {
  classification: FinalClassification;
  robustness: EvidenceRobustness;
  criticality: GapCriticality;
  infoSufficiency: InfoSufficiency;
  confidence: number;
  justification: string;
  evidences: { documentId: string; excerpt: string }[];
}

export async function generateRealAiAssessment(
  requirement: Pick<Requirement, "code" | "title" | "description" | "expectedEvidence">,
  installationId: string,
  // Análise prévia de consultoria (Gap Analysis) para ESTE requisito nesta
  // instalação — entra como referência que a IA pondera, não como verdade a copiar.
  priorAnalysis?: string | null
): Promise<RealAiAssessment | null> {
  try {
    const system = buildSystemPrompt();
    const userPrompt = buildUserPrompt(requirement, priorAnalysis);

    // Veredito entregue como chamada de ferramenta estrita — a API valida o
    // formato, então não há JSON.parse frágil de texto livre.
    const result = await runDocumentAgent(installationId, system, userPrompt, {
      maxTokens: 2048,
      finalTool: REGISTRAR_AVALIACAO_TOOL,
      forceFirstTool: "listar_documentos",
    });
    const p = result.finalToolInput;
    if (!p) return null;

    if (
      typeof p.classification !== "string" ||
      !VALID_CLASSIFICATION.has(p.classification) ||
      typeof p.robustness !== "string" ||
      !VALID_ROBUSTNESS.has(p.robustness) ||
      typeof p.criticality !== "string" ||
      !VALID_CRITICALITY.has(p.criticality) ||
      typeof p.infoSufficiency !== "string" ||
      !VALID_INFO_SUFFICIENCY.has(p.infoSufficiency) ||
      typeof p.justification !== "string" ||
      !p.justification.trim() ||
      typeof p.confidence !== "number" ||
      !Array.isArray(p.evidences)
    ) {
      return null;
    }

    // valida os documentId citados contra os documentos reais da instalação
    const docIds = new Set(
      (
        await prisma.documentFile.findMany({
          where: { installationId },
          select: { id: true },
        })
      ).map((d) => d.id)
    );
    const evidences = p.evidences
      .filter(
        (e): e is { documentId: string; excerpt: string } =>
          typeof e === "object" &&
          e !== null &&
          typeof (e as Record<string, unknown>).documentId === "string" &&
          typeof (e as Record<string, unknown>).excerpt === "string" &&
          docIds.has((e as Record<string, unknown>).documentId as string)
      )
      .slice(0, 3);

    return {
      classification: p.classification as FinalClassification,
      robustness: p.robustness as EvidenceRobustness,
      criticality: p.criticality as GapCriticality,
      infoSufficiency: p.infoSufficiency as InfoSufficiency,
      confidence: Math.max(0, Math.min(1, p.confidence)),
      justification: p.justification,
      evidences,
    };
  } catch (err) {
    if (err instanceof AiAgentNotConfiguredError) return null;
    console.error("[ai-evidence] falha na avaliação por agente:", err);
    return null;
  }
}

// Ferramenta terminal: a IA a chama para registrar o veredito. `strict: true`
// (aplicado em runDocumentAgent) garante que o input valida contra este schema.
const REGISTRAR_AVALIACAO_TOOL = {
  name: "registrar_avaliacao",
  description:
    "Registra o veredito final da avaliação de conformidade. Chame esta ferramenta UMA vez, " +
    "somente depois de consultar a base documental com as outras ferramentas.",
  input_schema: {
    type: "object" as const,
    properties: {
      classification: {
        type: "string",
        enum: ["ATENDE_TOTALMENTE", "ATENDE_PARCIALMENTE", "NAO_ATENDE", "NAO_SE_APLICA"],
      },
      robustness: { type: "string", enum: ["ROBUSTA", "PARCIAL", "FRACA", "AUSENTE"] },
      criticality: { type: "string", enum: ["ALTA", "MEDIA", "BAIXA", "NAO_SE_APLICA"] },
      infoSufficiency: { type: "string", enum: ["SUFICIENTE", "INSUFICIENTE"] },
      confidence: { type: "number", description: "0 a 1" },
      justification: {
        type: "string",
        description:
          "2 a 4 frases, em português, escritas por você com suas próprias palavras — NÃO copie o " +
          "texto da consultoria nem cole trechos longos dos documentos. Explique de forma direta por " +
          "que chegou a essa classificação e cite pelo nome os documentos que você consultou para " +
          "isso (ex.: 'com base no PAE Rev 1 e no Relatório de Simulado...'). Diga em uma frase o " +
          "que ainda falta, quando não atende totalmente.",
      },
      evidences: {
        type: "array",
        description: "Até 3 evidências que mais pesaram; lista vazia se nada for relevante.",
        items: {
          type: "object",
          properties: {
            documentId: { type: "string", description: "id exato do documento" },
            excerpt: { type: "string", description: "trecho literal ou quase literal (máx. ~300 caract.)" },
          },
          required: ["documentId", "excerpt"],
          additionalProperties: false,
        },
      },
    },
    required: [
      "classification",
      "robustness",
      "criticality",
      "infoSufficiency",
      "confidence",
      "justification",
      "evidences",
    ],
    additionalProperties: false,
  },
};

function buildSystemPrompt(): string {
  return (
    `Você é um auditor técnico avaliando a conformidade de uma instalação de disposição de ` +
    `rejeitos com um requisito específico do GISTM (Global Industry Standard on Tailings ` +
    `Management). Você tem ferramentas para consultar TODA a base documental da instalação — ` +
    `use-as antes de decidir.\n\n` +
    `COMO TRABALHAR (localizar → consultar → cruzar → avaliar):\n` +
    `1. listar_documentos para ver o que existe.\n` +
    `2. buscar para localizar candidatos ao que o requisito pede.\n` +
    `3. ler_documento para ler o conteúdo integral dos documentos relevantes — não decida por um ` +
    `trecho isolado quando a conclusão depende do documento inteiro.\n` +
    `4. Cruze informações entre documentos antes de concluir.\n\n` +
    `NÃO CONCLUA AUSÊNCIA PRECIPITADAMENTE: antes de dizer que algo não foi localizado, verifique ` +
    `documentos potencialmente relacionados, tente termos equivalentes/sinônimos, e considere ` +
    `referências cruzadas. Só então conclua que não encontrou — e diga onde procurou.\n\n` +
    `CRITÉRIOS DE ATENDIMENTO (menos rígidos — a EXISTÊNCIA de um documento já é evidência positiva):\n` +
    `- ATENDE_TOTALMENTE: há evidência documental clara e específica cobrindo o que o requisito pede.\n` +
    `- ATENDE_PARCIALMENTE: o documento esperado EXISTE e tem relação com o critério, mas a ` +
    `informação disponível não comprova todos os requisitos. Use TAMBÉM para "evidência encontrada, ` +
    `mas insuficiente" — NÃO classifique como não atende só porque o conteúdo não comprova tudo; ` +
    `reconheça a evidência documental e explique o que ainda não foi comprovado.\n` +
    `- NAO_ATENDE: nenhuma evidência foi localizada (após verificar de verdade) OU o documento ` +
    `claramente não atende ao critério.\n` +
    `- NAO_SE_APLICA: o requisito não se aplica a esta instalação.\n\n` +
    `Decida também:\n` +
    `- robustness: ROBUSTA | PARCIAL | FRACA | AUSENTE (força da evidência). Documento existe mas ` +
    `conteúdo insuficiente → FRACA (não AUSENTE).\n` +
    `- criticality: ALTA | MEDIA | BAIXA | NAO_SE_APLICA (NAO_SE_APLICA só se ATENDE_TOTALMENTE ou ` +
    `NAO_SE_APLICA; senão avalie o risco de o gap não ser corrigido).\n` +
    `- infoSufficiency: SUFICIENTE | INSUFICIENTE (havia informação suficiente pra decidir com segurança?).\n` +
    `- confidence: 0 a 1.\n` +
    `- justification: CURTA e DIRETA (2 a 4 frases), em português, escrita por você com suas próprias ` +
    `palavras. NÃO copie o texto da análise da consultoria nem cole trechos longos dos documentos — ` +
    `explique o raciocínio e cite pelo nome os documentos que você consultou para chegar à conclusão ` +
    `(e a seção, se possível). Se não atende totalmente, diga em uma frase o que falta.\n` +
    `- evidences: até 3 itens {documentId, excerpt}, com excerpt literal ou quase literal (máx. ~300 ` +
    `caracteres) do trecho que mais pesou; use o id exato do documento; lista vazia se nada for relevante.\n\n` +
    `RESPOSTA FINAL: primeiro consulte a base documental com listar_documentos/buscar/ler_documento; ` +
    `só depois de ler o que for relevante, chame a ferramenta registrar_avaliacao UMA vez com o veredito. ` +
    `Não registre a avaliação sem antes ter consultado os documentos.`
  );
}

function buildUserPrompt(
  requirement: Pick<Requirement, "code" | "title" | "description" | "expectedEvidence">,
  priorAnalysis?: string | null
): string {
  return (
    `Avalie a conformidade com o requisito ${requirement.code}: ${requirement.title}\n` +
    `${requirement.description}` +
    (requirement.expectedEvidence
      ? `\n\nEvidência tipicamente esperada para este requisito: ${requirement.expectedEvidence}`
      : "") +
    (priorAnalysis
      ? `\n\nANÁLISE PRÉVIA DA CONSULTORIA (referência qualificada — apoie-se nela se os documentos ` +
        `confirmarem; se divergir do que os documentos mostram, prevaleça o que você encontra e ` +
        `explique a divergência; não copie cegamente):\n${priorAnalysis}`
      : "") +
    `\n\nConsulte a base documental com as ferramentas e depois chame registrar_avaliacao com o veredito.`
  );
}
