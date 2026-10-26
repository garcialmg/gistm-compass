namespace GistmCompass.Domain.Services;

/// <summary>
/// Port of src/lib/readiness-score.ts — Índice de Prontidão para Auditoria.
/// </summary>
public static class ReadinessScore
{
    public sealed record Input(
        int ValidatedCount,
        int TotalRequirements,
        double? OverallCompliance,
        int CriticalGaps,
        int OverdueActions,
        int ExpiredDocuments,
        int PendingAiReview);

    public static int Compute(Input input)
    {
        var coverageRatio = input.TotalRequirements > 0
            ? (double)input.ValidatedCount / input.TotalRequirements
            : 0;
        var complianceRatio = input.OverallCompliance.HasValue
            ? input.OverallCompliance.Value / 100.0
            : 0;

        var baseScore = 100 * (0.5 * coverageRatio + 0.5 * complianceRatio);
        var penalty = Math.Min(
            40,
            input.CriticalGaps * 3 +
            input.OverdueActions * 2 +
            input.ExpiredDocuments * 2 +
            input.PendingAiReview * 0.5);

        return (int)Math.Max(0, Math.Min(100, Math.Round(baseScore - penalty)));
    }

    public static string Label(int score) =>
        score >= 70 ? "Pronta" :
        score >= 40 ? "Atenção" :
        "Crítica";
}
