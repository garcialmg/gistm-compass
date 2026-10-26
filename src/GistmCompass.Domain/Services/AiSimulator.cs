using System.Globalization;
using System.Text;
using System.Text.RegularExpressions;
using GistmCompass.Domain.Enums;

namespace GistmCompass.Domain.Services;

/// <summary>Port of src/lib/ai-simulator.ts — deterministic heuristic AI fallback.</summary>
public static class AiSimulator
{
    private static readonly HashSet<string> Stopwords = new(StringComparer.OrdinalIgnoreCase)
    {
        "de","da","do","das","dos","e","a","o","as","os","em","para","com","por",
        "que","um","uma","no","nas","nos","na","ao","aos","é","ser","como","seu",
        "sua","seus","suas","ou","se","não","mais","item"
    };

    public sealed record DocumentInput(string Id, string Title, string? ExtractedText);
    public sealed record RequirementInput(string Code, string Title, string Description);
    public sealed record EvidenceSuggestion(string DocumentId, string Excerpt);
    public sealed record Suggestion(
        FinalClassification Classification,
        EvidenceRobustness Robustness,
        GapCriticality Criticality,
        InfoSufficiency InfoSufficiency,
        string Justification,
        double Confidence,
        IReadOnlyList<EvidenceSuggestion> Evidences);

    public static HashSet<string> Tokenize(string text)
    {
        var normalized = text.ToLowerInvariant().Normalize(NormalizationForm.FormD);
        var sb = new StringBuilder(normalized.Length);
        foreach (var c in normalized)
        {
            var cat = CharUnicodeInfo.GetUnicodeCategory(c);
            if (cat != UnicodeCategory.NonSpacingMark) sb.Append(c);
        }
        var tokens = Regex.Split(sb.ToString().Normalize(NormalizationForm.FormC), @"[^a-z0-9]+");
        return tokens.Where(w => w.Length > 3 && !Stopwords.Contains(w)).ToHashSet(StringComparer.Ordinal);
    }

    public static double OverlapScore(HashSet<string> requirementTokens, string documentText)
    {
        if (requirementTokens.Count == 0) return 0;
        var docTokens = Tokenize(documentText);
        if (docTokens.Count == 0) return 0;
        var matches = requirementTokens.Count(t => docTokens.Contains(t));
        return (double)matches / requirementTokens.Count;
    }

    private static double SeededRandom(string seed)
    {
        unchecked
        {
            uint hash = 5381;
            foreach (var c in seed)
                hash = (hash * 33) ^ c;
            return (hash % 10000) / 10000.0;
        }
    }

    public static Suggestion Simulate(RequirementInput requirement, IReadOnlyList<DocumentInput> documents)
    {
        var requirementTokens = Tokenize($"{requirement.Title} {requirement.Description}");
        var seed = $"{requirement.Code}::{string.Join(",", documents.Select(d => d.Id))}";
        var noise = SeededRandom(seed);

        if (documents.Count == 0)
        {
            return new Suggestion(
                FinalClassification.NAO_ATENDE,
                EvidenceRobustness.AUSENTE,
                GapCriticality.ALTA,
                InfoSufficiency.INSUFICIENTE,
                "Nenhum documento foi vinculado a este requisito na base documental. " +
                "A leitura inteligente não localizou evidências de suporte. Sugestão: " +
                "\"Não atende\", com criticidade alta, até que documentação seja anexada e revisada por um especialista.",
                0.3,
                Array.Empty<EvidenceSuggestion>());
        }

        var scored = documents.Select(doc =>
        {
            var text = doc.ExtractedText ?? doc.Title;
            return (Doc: doc, Score: OverlapScore(requirementTokens, text));
        }).ToList();

        var bestScore = scored.Max(s => s.Score);
        var multiDocBonus = Math.Min(0.15, (documents.Count - 1) * 0.05);
        var combined = Math.Min(1, bestScore * 0.55 + noise * 0.35 + multiDocBonus);

        FinalClassification classification;
        EvidenceRobustness robustness;
        GapCriticality criticality;

        if (combined >= 0.72)
        {
            classification = FinalClassification.ATENDE_TOTALMENTE;
            robustness = EvidenceRobustness.ROBUSTA;
            criticality = GapCriticality.NAO_SE_APLICA;
        }
        else if (combined >= 0.48)
        {
            classification = FinalClassification.ATENDE_PARCIALMENTE;
            robustness = EvidenceRobustness.PARCIAL;
            criticality = GapCriticality.MEDIA;
        }
        else if (combined >= 0.25)
        {
            classification = FinalClassification.ATENDE_PARCIALMENTE;
            robustness = EvidenceRobustness.FRACA;
            criticality = GapCriticality.ALTA;
        }
        else
        {
            classification = FinalClassification.NAO_ATENDE;
            robustness = EvidenceRobustness.AUSENTE;
            criticality = GapCriticality.ALTA;
        }

        var confidence = Math.Round((0.35 + combined * 0.55) * 100) / 100;
        var infoSufficiency = robustness == EvidenceRobustness.AUSENTE
            ? InfoSufficiency.INSUFICIENTE
            : InfoSufficiency.SUFICIENTE;

        var ranked = scored.OrderByDescending(s => s.Score).ToList();
        var topMatches = ranked.Where(s => s.Score > 0).Take(3).ToList();
        var relevantDocsText = topMatches.Count > 0
            ? string.Join(", ", topMatches.Select(s => $"\"{s.Doc.Title}\""))
            : "nenhum documento com correspondência textual relevante";

        var percentText = (int)Math.Round(combined * 100);
        var justification =
            $"A leitura automatizada (simulada) buscou correspondência textual entre este requisito e " +
            $"os {documents.Count} documento(s) da base documental desta instalação. Os mais " +
            $"relevantes encontrados foram: {relevantDocsText}. A aderência textual estimada foi de " +
            $"{percentText}%. Classificação sugerida: \"{ClassificationLabel(classification)}\", com " +
            $"robustez de evidência \"{RobustnessLabel(robustness)}\". Esta sugestão deve ser " +
            $"confirmada, ajustada ou rejeitada por um revisor técnico antes da validação final.";

        var evidences = ranked.Take(3).Select(s =>
        {
            var excerpt = s.Doc.ExtractedText is { Length: > 0 } t
                ? t[..Math.Min(240, t.Length)].Trim() + (t.Length > 240 ? "…" : "")
                : $"[Trecho ilustrativo] Documento \"{s.Doc.Title}\" relacionado ao requisito {requirement.Code}.";
            return new EvidenceSuggestion(s.Doc.Id, excerpt);
        }).ToList();

        return new Suggestion(classification, robustness, criticality, infoSufficiency, justification, confidence, evidences);
    }

    public static string ClassificationLabel(FinalClassification? value) => value switch
    {
        FinalClassification.ATENDE_TOTALMENTE => "Atende totalmente",
        FinalClassification.ATENDE_PARCIALMENTE => "Atende parcialmente",
        FinalClassification.NAO_ATENDE => "Não atende",
        FinalClassification.NAO_SE_APLICA => "Não se aplica",
        _ => "Não avaliado"
    };

    public static string RobustnessLabel(EvidenceRobustness? value) => value switch
    {
        EvidenceRobustness.ROBUSTA => "Robusta",
        EvidenceRobustness.PARCIAL => "Parcial",
        EvidenceRobustness.FRACA => "Fraca",
        EvidenceRobustness.AUSENTE => "Ausente",
        _ => "—"
    };
}
