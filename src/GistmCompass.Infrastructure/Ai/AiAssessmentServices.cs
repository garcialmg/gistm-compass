using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using GistmCompass.Application.Abstractions;
using GistmCompass.Domain.Enums;
using GistmCompass.Domain.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GistmCompass.Infrastructure.Ai;

/// <summary>Deterministic heuristic — always available offline.</summary>
public class HeuristicAiAssessmentService : IAiAssessmentService
{
    public Task<AiSimulator.Suggestion> AssessAsync(
        AiSimulator.RequirementInput requirement,
        IReadOnlyList<AiSimulator.DocumentInput> documents,
        string? priorExternalAnalysis,
        CancellationToken ct = default)
    {
        var suggestion = AiSimulator.Simulate(requirement, documents);
        if (!string.IsNullOrWhiteSpace(priorExternalAnalysis))
        {
            var note = "\n\nReferência de análise externa considerada na sugestão (resumo local): "
                       + priorExternalAnalysis.Trim()[..Math.Min(400, priorExternalAnalysis.Trim().Length)];
            suggestion = suggestion with { Justification = suggestion.Justification + note };
        }
        return Task.FromResult(suggestion);
    }
}

/// <summary>Optional Anthropic HTTP client — falls back to heuristic on failure/missing key.</summary>
public class AnthropicAiAssessmentService : IAiAssessmentService
{
    private readonly IHttpClientFactory _httpClientFactory;
    private readonly IConfiguration _config;
    private readonly HeuristicAiAssessmentService _fallback;
    private readonly ILogger<AnthropicAiAssessmentService> _logger;

    public AnthropicAiAssessmentService(
        IHttpClientFactory httpClientFactory,
        IConfiguration config,
        HeuristicAiAssessmentService fallback,
        ILogger<AnthropicAiAssessmentService> logger)
    {
        _httpClientFactory = httpClientFactory;
        _config = config;
        _fallback = fallback;
        _logger = logger;
    }

    public async Task<AiSimulator.Suggestion> AssessAsync(
        AiSimulator.RequirementInput requirement,
        IReadOnlyList<AiSimulator.DocumentInput> documents,
        string? priorExternalAnalysis,
        CancellationToken ct = default)
    {
        var apiKey = _config["Anthropic:ApiKey"];
        if (string.IsNullOrWhiteSpace(apiKey))
            return await _fallback.AssessAsync(requirement, documents, priorExternalAnalysis, ct);

        try
        {
            var client = _httpClientFactory.CreateClient("anthropic");
            client.DefaultRequestHeaders.Remove("x-api-key");
            client.DefaultRequestHeaders.Add("x-api-key", apiKey);
            client.DefaultRequestHeaders.Remove("anthropic-version");
            client.DefaultRequestHeaders.Add("anthropic-version", "2023-06-01");

            var docSummaries = string.Join("\n---\n", documents.Select(d =>
                $"DOC {d.Id} — {d.Title}\n{(d.ExtractedText ?? "")[..Math.Min(4000, (d.ExtractedText ?? "").Length)]}"));

            var prompt =
                $"Avalie o requisito GISTM {requirement.Code}: {requirement.Title}\n{requirement.Description}\n\n" +
                $"Documentos:\n{docSummaries}\n\n" +
                (priorExternalAnalysis is null ? "" : $"Análise externa:\n{priorExternalAnalysis}\n\n") +
                "Responda SOMENTE JSON com campos: classification, robustness, criticality, infoSufficiency, justification, confidence (0-1). " +
                "classification ∈ ATENDE_TOTALMENTE|ATENDE_PARCIALMENTE|NAO_ATENDE|NAO_SE_APLICA; " +
                "robustness ∈ ROBUSTA|PARCIAL|FRACA|AUSENTE; criticality ∈ ALTA|MEDIA|BAIXA|NAO_SE_APLICA; " +
                "infoSufficiency ∈ SUFICIENTE|INSUFICIENTE.";

            var body = new
            {
                model = _config["Anthropic:Model"] ?? "claude-sonnet-4-20250514",
                max_tokens = 1024,
                messages = new[] { new { role = "user", content = prompt } }
            };

            using var content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
            using var response = await client.PostAsync("https://api.anthropic.com/v1/messages", content, ct);
            if (!response.IsSuccessStatusCode)
            {
                _logger.LogWarning("Anthropic HTTP {Status} — fallback heurístico", response.StatusCode);
                return await _fallback.AssessAsync(requirement, documents, priorExternalAnalysis, ct);
            }

            using var doc = await JsonDocument.ParseAsync(await response.Content.ReadAsStreamAsync(ct), cancellationToken: ct);
            var text = doc.RootElement.GetProperty("content")[0].GetProperty("text").GetString() ?? "";
            var jsonStart = text.IndexOf('{');
            var jsonEnd = text.LastIndexOf('}');
            if (jsonStart < 0 || jsonEnd <= jsonStart)
                return await _fallback.AssessAsync(requirement, documents, priorExternalAnalysis, ct);

            using var parsed = JsonDocument.Parse(text[jsonStart..(jsonEnd + 1)]);
            var root = parsed.RootElement;
            var classification = Enum.Parse<FinalClassification>(root.GetProperty("classification").GetString()!, true);
            var robustness = Enum.Parse<EvidenceRobustness>(root.GetProperty("robustness").GetString()!, true);
            var criticality = Enum.Parse<GapCriticality>(root.GetProperty("criticality").GetString()!, true);
            var info = Enum.Parse<InfoSufficiency>(root.GetProperty("infoSufficiency").GetString()!, true);
            var justification = root.GetProperty("justification").GetString() ?? "";
            var confidence = root.TryGetProperty("confidence", out var c) ? c.GetDouble() : 0.6;

            var heuristic = AiSimulator.Simulate(requirement, documents);
            return new AiSimulator.Suggestion(
                classification, robustness, criticality, info, justification, confidence, heuristic.Evidences);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Anthropic falhou — fallback heurístico");
            return await _fallback.AssessAsync(requirement, documents, priorExternalAnalysis, ct);
        }
    }
}
