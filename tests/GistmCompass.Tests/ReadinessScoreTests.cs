using GistmCompass.Domain.Services;

namespace GistmCompass.Tests;

public class ReadinessScoreTests
{
    [Fact]
    public void Perfect_coverage_and_compliance_scores_high()
    {
        var score = ReadinessScore.Compute(new ReadinessScore.Input(
            ValidatedCount: 77,
            TotalRequirements: 77,
            OverallCompliance: 100,
            CriticalGaps: 0,
            OverdueActions: 0,
            ExpiredDocuments: 0,
            PendingAiReview: 0));
        Assert.Equal(100, score);
        Assert.Equal("Pronta", ReadinessScore.Label(score));
    }

    [Fact]
    public void Penalties_are_capped_at_40()
    {
        var score = ReadinessScore.Compute(new ReadinessScore.Input(
            ValidatedCount: 77,
            TotalRequirements: 77,
            OverallCompliance: 100,
            CriticalGaps: 20,
            OverdueActions: 20,
            ExpiredDocuments: 20,
            PendingAiReview: 40));
        Assert.Equal(60, score); // 100 - 40
    }

    [Fact]
    public void Empty_installation_is_critical()
    {
        var score = ReadinessScore.Compute(new ReadinessScore.Input(0, 77, null, 0, 0, 0, 0));
        Assert.Equal(0, score);
        Assert.Equal("Crítica", ReadinessScore.Label(score));
    }
}

public class MaturityTests
{
    [Theory]
    [InlineData(80, true, "Otimizado")]
    [InlineData(50, true, "Gerenciado")]
    [InlineData(30, true, "Em desenvolvimento")]
    [InlineData(10, true, "Inicial")]
    [InlineData(0, false, "Sem avaliação")]
    public void Labels(double pct, bool hasData, string expected) =>
        Assert.Equal(expected, Maturity.Label(pct, hasData));
}

public class AiSimulatorTests
{
    [Fact]
    public void No_documents_suggests_nao_atende()
    {
        var suggestion = AiSimulator.Simulate(
            new AiSimulator.RequirementInput("1.1", "Engajamento", "Engajar comunidades afetadas"),
            Array.Empty<AiSimulator.DocumentInput>());
        Assert.Equal(Domain.Enums.FinalClassification.NAO_ATENDE, suggestion.Classification);
        Assert.Equal(Domain.Enums.EvidenceRobustness.AUSENTE, suggestion.Robustness);
    }

    [Fact]
    public void Same_input_is_deterministic()
    {
        var req = new AiSimulator.RequirementInput("2.1", "Base de conhecimentos", "Manter base interdisciplinar de conhecimentos de rejeitos");
        var docs = new[]
        {
            new AiSimulator.DocumentInput("d1", "Manual de rejeitos", "base conhecimentos interdisciplinar gestão rejeitos ciclo vida estrutura")
        };
        var a = AiSimulator.Simulate(req, docs);
        var b = AiSimulator.Simulate(req, docs);
        Assert.Equal(a.Classification, b.Classification);
        Assert.Equal(a.Confidence, b.Confidence);
        Assert.Equal(a.Justification, b.Justification);
    }
}
