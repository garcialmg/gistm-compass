import Anthropic from "@anthropic-ai/sdk";
import type { EvidenceRobustness, FinalClassification, GapCriticality, Requirement } from "@prisma/client";
import { classificationLabel, robustnessLabel, criticalityLabel } from "@/lib/ai-simulator";

/**
 * Sugestão de ação corretiva com IA real (Claude), disparada sob demanda pelo
 * botão "Sugerir ação com IA" na tela do requisito — nunca roda automaticamente
 * ao carregar a página. Qualquer falha (sem chave, erro de rede, JSON
 * inválido) retorna null; quem chamou cai de volta para o texto-modelo
 * genérico que já existia, então nunca quebra o fluxo de criação de ação.
 */

export interface RealActionSuggestion {
  description: string;
  area: string | null;
}

export async function generateActionSuggestion(
  requirement: Pick<Requirement, "code" | "title" | "description">,
  classification: FinalClassification,
  robustness: EvidenceRobustness,
  criticality: GapCriticality,
  justification: string
): Promise<RealActionSuggestion | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return null;
  if (!justification.trim()) return null;

  try {
    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 512,
      system:
        `Você é um especialista em gestão de barragens de rejeitos apoiando um operador a fechar ` +
        `um gap de conformidade com o GISTM (Global Industry Standard on Tailings Management). ` +
        `Dado um requisito do padrão e o motivo pelo qual ele não foi totalmente atendido, proponha ` +
        `UMA ação corretiva específica, concreta e verificável — nunca um texto genérico como ` +
        `"adequar o atendimento ao requisito". Evite jargão vago; escreva como uma instrução de ` +
        `trabalho que uma equipe de engenharia/geotecnia conseguiria executar e depois comprovar. ` +
        `Sugira também a área responsável mais provável (ex.: Engenharia, Geotecnia, Meio Ambiente, ` +
        `Relações com Comunidades, Jurídico, Segurança Operacional), ou null se não for óbvio. ` +
        `Responda em português, em JSON estrito e nada mais, no formato exato: ` +
        `{"description": "...", "area": "..." ou null}. A descrição deve ter no máximo 3 frases.`,
      messages: [
        {
          role: "user",
          content:
            `Requisito ${requirement.code}: ${requirement.title}\n${requirement.description}\n\n` +
            `Classificação: ${classificationLabel(classification)} ` +
            `(robustez da evidência: ${robustnessLabel(robustness)}, criticidade: ${criticalityLabel(criticality)})\n\n` +
            `Justificativa técnica do gap:\n${justification}`,
        },
      ],
    });

    const text = message.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();

    const jsonText = text.replace(/^```json\s*|^```\s*|```$/g, "").trim();
    const parsed: unknown = JSON.parse(jsonText);
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).description !== "string"
    ) {
      return null;
    }

    const area = (parsed as Record<string, unknown>).area;
    return {
      description: (parsed as { description: string }).description,
      area: typeof area === "string" && area.trim() ? area : null,
    };
  } catch {
    return null;
  }
}
