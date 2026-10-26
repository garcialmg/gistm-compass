import type {
  DocumentFile,
  EvidenceRobustness,
  FinalClassification,
  GapCriticality,
  InfoSufficiency,
  Requirement,
} from "@prisma/client";

/**
 * Simulador da camada de "leitura inteligente de evidências" descrita na
 * proposta GISTM Compass. Não chama nenhum modelo de IA real — produz uma
 * sugestão de classificação determinística e explicável a partir de uma
 * heurística de sobreposição de palavras-chave entre o requisito e os
 * documentos vinculados, combinada com uma variação pseudo-aleatória
 * determinística (mesma entrada → mesma saída).
 *
 * A interface de saída (classificação, robustez, criticidade, justificativa,
 * confiança, trechos de evidência) é a mesma que uma integração real com a
 * API da Anthropic deveria produzir, para que a troca por IA real no futuro
 * não exija mudanças na camada de revisão humana.
 */

const STOPWORDS = new Set([
  "de","da","do","das","dos","e","a","o","as","os","em","para","com","por",
  "que","um","uma","no","nas","nos","na","ao","aos","é","ser","como","seu",
  "sua","seus","suas","ou","se","não","mais","item",
]);

export function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .split(/[^a-z0-9]+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w))
  );
}

// Hash determinístico simples (djb2) para gerar uma variação pseudo-aleatória
// estável a partir de uma string (mesmo requisito + mesmos documentos sempre
// produz o mesmo resultado).
function seededRandom(seed: string): number {
  let hash = 5381;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 33) ^ seed.charCodeAt(i);
  }
  return ((hash >>> 0) % 10000) / 10000;
}

export function overlapScore(requirementTokens: Set<string>, documentText: string): number {
  if (requirementTokens.size === 0) return 0;
  const docTokens = tokenize(documentText);
  if (docTokens.size === 0) return 0;
  let matches = 0;
  for (const token of requirementTokens) {
    if (docTokens.has(token)) matches++;
  }
  return matches / requirementTokens.size;
}

export interface AiEvidenceSuggestion {
  documentId: string;
  excerpt: string;
}

export interface AiSuggestion {
  classification: FinalClassification;
  robustness: EvidenceRobustness;
  criticality: GapCriticality;
  infoSufficiency: InfoSufficiency;
  justification: string;
  confidence: number;
  evidences: AiEvidenceSuggestion[];
}

export function simulateAiReading(
  requirement: Pick<Requirement, "code" | "title" | "description">,
  documents: Pick<DocumentFile, "id" | "title" | "extractedText">[]
): AiSuggestion {
  const requirementTokens = tokenize(`${requirement.title} ${requirement.description}`);
  const seed = `${requirement.code}::${documents.map((d) => d.id).join(",")}`;
  const noise = seededRandom(seed);

  if (documents.length === 0) {
    return {
      classification: "NAO_ATENDE",
      robustness: "AUSENTE",
      criticality: "ALTA",
      infoSufficiency: "INSUFICIENTE",
      confidence: 0.3,
      justification:
        "Nenhum documento foi vinculado a este requisito na base documental. " +
        "A leitura inteligente não localizou evidências de suporte. Sugestão: " +
        "\"Não atende\", com criticidade alta, até que documentação seja anexada e revisada por um especialista.",
      evidences: [],
    };
  }

  const scored = documents.map((doc) => {
    const text = doc.extractedText ?? doc.title;
    const score = overlapScore(requirementTokens, text);
    return { doc, score };
  });

  const bestScore = Math.max(...scored.map((s) => s.score));
  // Combina a sobreposição textual real com a variação determinística, e dá
  // um bônus por haver múltiplos documentos vinculados (mais contexto).
  const multiDocBonus = Math.min(0.15, (documents.length - 1) * 0.05);
  const combined = Math.min(1, bestScore * 0.55 + noise * 0.35 + multiDocBonus);

  let classification: FinalClassification;
  let robustness: EvidenceRobustness;
  let criticality: GapCriticality;

  if (combined >= 0.72) {
    classification = "ATENDE_TOTALMENTE";
    robustness = "ROBUSTA";
    criticality = "NAO_SE_APLICA";
  } else if (combined >= 0.48) {
    classification = "ATENDE_PARCIALMENTE";
    robustness = "PARCIAL";
    criticality = "MEDIA";
  } else if (combined >= 0.25) {
    classification = "ATENDE_PARCIALMENTE";
    robustness = "FRACA";
    criticality = "ALTA";
  } else {
    classification = "NAO_ATENDE";
    robustness = "AUSENTE";
    criticality = "ALTA";
  }

  const confidence = Math.round((0.35 + combined * 0.55) * 100) / 100;
  const infoSufficiency: InfoSufficiency = robustness === "AUSENTE" ? "INSUFICIENTE" : "SUFICIENTE";

  // A justificativa cita só os documentos que de fato pesaram na sugestão
  // (mesmo critério usado para as evidências abaixo) — listar os N documentos
  // da base inteira, mesmo os sem nenhuma sobreposição textual, virava uma
  // parede de nomes de arquivo sem informação real quando a instalação tinha
  // muitos documentos cadastrados.
  const ranked = [...scored].sort((a, b) => b.score - a.score);
  const topMatches = ranked.filter((s) => s.score > 0).slice(0, 3);
  const relevantDocsText =
    topMatches.length > 0
      ? topMatches.map((s) => `"${s.doc.title}"`).join(", ")
      : "nenhum documento com correspondência textual relevante";

  const percentText = Math.round(combined * 100);
  const justification =
    `A leitura automatizada (simulada) buscou correspondência textual entre este requisito e ` +
    `os ${documents.length} documento(s) da base documental desta instalação. Os mais ` +
    `relevantes encontrados foram: ${relevantDocsText}. A aderência textual estimada foi de ` +
    `${percentText}%. Classificação sugerida: "${classificationLabel(classification)}", com ` +
    `robustez de evidência "${robustnessLabel(robustness)}". Esta sugestão deve ser ` +
    `confirmada, ajustada ou rejeitada por um revisor técnico antes da validação final.`;

  const evidences: AiEvidenceSuggestion[] = ranked.slice(0, 3).map(({ doc }) => ({
    documentId: doc.id,
    excerpt: doc.extractedText
      ? doc.extractedText.slice(0, 240).trim() + (doc.extractedText.length > 240 ? "…" : "")
      : `[Trecho ilustrativo] Documento "${doc.title}" relacionado ao requisito ${requirement.code}.`,
  }));

  return {
    classification,
    robustness,
    criticality,
    infoSufficiency,
    confidence,
    justification,
    evidences,
  };
}

export function infoSufficiencyLabel(value: InfoSufficiency | null | undefined): string {
  switch (value) {
    case "SUFICIENTE":
      return "Informação suficiente";
    case "INSUFICIENTE":
      return "Informação insuficiente";
    default:
      return "—";
  }
}

export function classificationLabel(value: FinalClassification | null | undefined): string {
  switch (value) {
    case "ATENDE_TOTALMENTE":
      return "Atende totalmente";
    case "ATENDE_PARCIALMENTE":
      return "Atende parcialmente";
    case "NAO_ATENDE":
      return "Não atende";
    case "NAO_SE_APLICA":
      return "Não se aplica";
    default:
      return "Não avaliado";
  }
}

export function robustnessLabel(value: EvidenceRobustness | null | undefined): string {
  switch (value) {
    case "ROBUSTA":
      return "Robusta";
    case "PARCIAL":
      return "Parcial";
    case "FRACA":
      return "Fraca";
    case "AUSENTE":
      return "Ausente";
    default:
      return "—";
  }
}

export function criticalityLabel(value: GapCriticality | null | undefined): string {
  switch (value) {
    case "ALTA":
      return "Alta";
    case "MEDIA":
      return "Média";
    case "BAIXA":
      return "Baixa";
    case "NAO_SE_APLICA":
      return "Não se aplica";
    default:
      return "—";
  }
}
