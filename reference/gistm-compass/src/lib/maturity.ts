// Módulo de maturidade da conformidade por tema (item 12 da proposta,
// "funcionalidades recomendadas para evolução do produto"): traduz o
// percentual de atendimento por tema — que já é calculado em report.ts — numa
// escala qualitativa de maturidade, mais fácil de comunicar para quem não
// olha os números todo dia.
export function maturityLabel(pct: number, hasData: boolean): string {
  if (!hasData) return "Sem avaliação";
  if (pct >= 75) return "Otimizado";
  if (pct >= 50) return "Gerenciado";
  if (pct >= 25) return "Em desenvolvimento";
  return "Inicial";
}
