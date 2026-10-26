// Índice de Prontidão para Auditoria: uma nota única (0-100) que resume o
// quão pronta uma instalação estaria para uma auditoria/revisão externa
// agora. Combina cobertura da avaliação, nível de atendimento e três sinais
// de risco operacional que uma matriz de % isolada não capta.
//
// Fórmula (deliberadamente simples e explicável, não um índice "caixa preta"):
//   base = 100 * (0.5 * cobertura + 0.5 * atendimento)
//   penalidade = min(40, gaps_altos*3 + ações_vencidas*2 + docs_vencidos*2 + revisões_pendentes*0.5)
//   índice = clamp(base - penalidade, 0, 100)

export interface ReadinessInput {
  validatedCount: number;
  totalRequirements: number;
  overallCompliance: number | null; // 0-100 ou null se nada validado
  criticalGaps: number;
  overdueActions: number;
  expiredDocuments: number;
  pendingAiReview: number;
}

export function computeReadinessScore(input: ReadinessInput): number {
  const coverageRatio =
    input.totalRequirements > 0 ? input.validatedCount / input.totalRequirements : 0;
  const complianceRatio = input.overallCompliance !== null ? input.overallCompliance / 100 : 0;

  const base = 100 * (0.5 * coverageRatio + 0.5 * complianceRatio);
  const penalty = Math.min(
    40,
    input.criticalGaps * 3 +
      input.overdueActions * 2 +
      input.expiredDocuments * 2 +
      input.pendingAiReview * 0.5
  );

  return Math.max(0, Math.min(100, Math.round(base - penalty)));
}

export function readinessLabel(score: number): string {
  if (score >= 70) return "Pronta";
  if (score >= 40) return "Atenção";
  return "Crítica";
}
