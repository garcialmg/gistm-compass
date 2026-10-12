import { tokenize, overlapScore } from "@/lib/ai-simulator";
import type { DocumentFile, Requirement } from "@prisma/client";

export interface MissingDocumentHint {
  requirementId: string;
  code: string;
  title: string;
  expectedEvidence: string;
}

const NO_MATCH_THRESHOLD = 0.15;

/**
 * Aproximação do item 9.3 da proposta ("identificar documentos faltantes"):
 * compara a evidência esperada de cada requisito (biblioteca de referência)
 * com o texto de TODA a base documental da instalação — não só com o que já
 * foi formalmente vinculado como evidência. Se nenhum documento da base tem
 * sobreposição textual relevante com a evidência esperada, é provável que o
 * tipo de documento certo simplesmente não tenha sido enviado ainda.
 *
 * Mesma heurística determinística de palavras-chave do simulador de IA
 * (`src/lib/ai-simulator.ts`), aplicada num sentido diferente: em vez de
 * "qual documento melhor explica este requisito", pergunta "existe ALGUM
 * documento que sequer se aproxime do que era esperado".
 */
export function detectMissingDocumentHints(
  requirements: Pick<Requirement, "id" | "code" | "title" | "expectedEvidence">[],
  documents: Pick<DocumentFile, "title" | "extractedText">[]
): MissingDocumentHint[] {
  const hints: MissingDocumentHint[] = [];

  for (const requirement of requirements) {
    if (!requirement.expectedEvidence) continue;
    const expectedTokens = tokenize(requirement.expectedEvidence);
    if (expectedTokens.size === 0) continue;

    const bestScore = documents.length
      ? Math.max(
          ...documents.map((doc) => overlapScore(expectedTokens, doc.extractedText ?? doc.title))
        )
      : 0;

    if (bestScore < NO_MATCH_THRESHOLD) {
      hints.push({
        requirementId: requirement.id,
        code: requirement.code,
        title: requirement.title,
        expectedEvidence: requirement.expectedEvidence,
      });
    }
  }

  return hints;
}
