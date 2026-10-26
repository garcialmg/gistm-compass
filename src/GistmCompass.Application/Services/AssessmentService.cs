using GistmCompass.Application.Abstractions;
using GistmCompass.Domain.Entities;
using GistmCompass.Domain.Enums;
using GistmCompass.Domain.Services;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace GistmCompass.Application.Services;

public class AssessmentService
{
    private readonly IAppDbContext _db;
    private readonly IInstallationGate _gate;
    private readonly IAiAssessmentService _ai;
    private readonly IJobQueue _queue;

    public AssessmentService(IAppDbContext db, IInstallationGate gate, IAiAssessmentService ai, IJobQueue queue)
    {
        _db = db;
        _gate = gate;
        _ai = ai;
        _queue = queue;
    }

    public async Task<Assessment> GetOrCreateAsync(string requirementId, string installationId, string cycleId, CancellationToken ct = default)
    {
        var existing = await _db.Assessments.FirstOrDefaultAsync(
            a => a.RequirementId == requirementId && a.InstallationId == installationId && a.CycleId == cycleId, ct);
        if (existing is not null) return existing;

        var assessment = new Assessment
        {
            RequirementId = requirementId,
            InstallationId = installationId,
            CycleId = cycleId
        };
        _db.Assessments.Add(assessment);
        await _db.SaveChangesAsync(ct);
        return assessment;
    }

    public async Task ApplyAiSuggestionAsync(string installationId, string requirementId, bool useRealAi, CancellationToken ct = default)
    {
        var ctx = await _gate.GetInstallationContextAsync(installationId, ct: ct);
        if (!ctx.IsLatestCycle)
            throw new InvalidOperationException("Não é possível rodar a IA em um ciclo encerrado.");

        var requirement = await _db.Requirements.FirstOrDefaultAsync(r => r.Id == requirementId, ct)
            ?? throw new KeyNotFoundException("Requisito não encontrado.");
        var documents = await _db.Documents.Where(d => d.InstallationId == installationId).ToListAsync(ct);

        string? prior = null;
        if (useRealAi)
        {
            prior = await _db.ExternalAnalyses
                .Where(e => e.InstallationId == installationId && e.RequirementId == requirementId)
                .OrderByDescending(e => e.UpdatedAt)
                .Select(e => e.Content)
                .FirstOrDefaultAsync(ct);
        }

        var suggestion = await _ai.AssessAsync(
            new AiSimulator.RequirementInput(requirement.Code, requirement.Title, requirement.Description),
            documents.Select(d => new AiSimulator.DocumentInput(d.Id, d.Title, d.ExtractedText)).ToList(),
            prior,
            ct);

        var assessment = await GetOrCreateAsync(requirementId, installationId, ctx.Cycle.Id, ct);

        // Delete AI evidences only for this installation (not global by requirementId)
        var docIds = documents.Select(d => d.Id).ToHashSet();
        var toRemove = await _db.Evidences
            .Where(e => e.RequirementId == requirementId && e.AiGenerated && docIds.Contains(e.DocumentId))
            .ToListAsync(ct);
        _db.Evidences.RemoveRange(toRemove);

        foreach (var ev in suggestion.Evidences)
        {
            if (!docIds.Contains(ev.DocumentId)) continue;
            _db.Evidences.Add(new Evidence
            {
                RequirementId = requirementId,
                DocumentId = ev.DocumentId,
                Excerpt = ev.Excerpt,
                AiGenerated = true
            });
        }

        assessment.AiClassification = suggestion.Classification;
        assessment.AiRobustness = suggestion.Robustness;
        assessment.AiCriticality = suggestion.Criticality;
        assessment.AiInfoSufficiency = suggestion.InfoSufficiency;
        assessment.AiJustification = suggestion.Justification;
        assessment.AiConfidence = suggestion.Confidence;
        assessment.AiJobStatus = JobStatus.DONE;
        if (assessment.Status != ReviewStatus.VALIDADO)
            assessment.Status = ReviewStatus.EM_REVISAO;
        assessment.UpdatedAt = DateTime.UtcNow;

        _db.AuditLogs.Add(new AuditLog
        {
            AssessmentId = assessment.Id,
            Actor = useRealAi ? "IA" : "IA (simulada)",
            Action = "SUGESTAO_IA_GERADA",
            Note = $"Classificação sugerida: {suggestion.Classification}. Confiança: {Math.Round(suggestion.Confidence * 100)}%."
        });

        await _db.SaveChangesAsync(ct);
    }

    public async Task EnqueueAiAsync(string installationId, string requirementId, CancellationToken ct = default)
    {
        var ctx = await _gate.GetInstallationContextAsync(installationId, ct: ct);
        if (!ctx.IsLatestCycle)
            throw new InvalidOperationException("Não é possível rodar a IA em um ciclo encerrado.");

        var assessment = await GetOrCreateAsync(requirementId, installationId, ctx.Cycle.Id, ct);
        assessment.AiJobStatus = JobStatus.PENDING;
        assessment.UpdatedAt = DateTime.UtcNow;

        var job = new BackgroundJob
        {
            Type = JobType.AiAssessment,
            Status = JobStatus.PENDING,
            OrganizationId = ctx.User.OrganizationId,
            InstallationId = installationId,
            PayloadJson = JsonSerializer.Serialize(new { installationId, requirementId })
        };
        _db.BackgroundJobs.Add(job);
        await _db.SaveChangesAsync(ct);
        await _queue.EnqueueAsync(job, ct);
    }

    public async Task ValidateAsync(
        string installationId,
        string assessmentId,
        string requirementId,
        string? themeId,
        FinalClassification finalClassification,
        EvidenceRobustness finalRobustness,
        GapCriticality finalCriticality,
        InfoSufficiency finalInfoSufficiency,
        string finalJustification,
        string reviewedBy,
        bool saveAsTemplate,
        string? templateTitle,
        CancellationToken ct = default)
    {
        if (string.IsNullOrWhiteSpace(finalJustification))
            throw new InvalidOperationException("A justificativa técnica final é obrigatória para validar a avaliação.");

        var installation = await _gate.AssertOwnershipAsync(installationId, ct);
        var assessment = await _db.Assessments.FirstOrDefaultAsync(a => a.Id == assessmentId, ct);
        if (assessment is null || assessment.InstallationId != installationId)
            throw new KeyNotFoundException("Avaliação não encontrada nesta instalação.");

        var ctx = await _gate.GetInstallationContextAsync(installationId, ct: ct);
        if (!ctx.IsLatestCycle)
            throw new InvalidOperationException("Ciclo encerrado — somente leitura.");

        assessment.FinalClassification = finalClassification;
        assessment.FinalRobustness = finalRobustness;
        assessment.FinalCriticality = finalCriticality;
        assessment.FinalInfoSufficiency = finalInfoSufficiency;
        assessment.FinalJustification = finalJustification.Trim();
        assessment.Status = ReviewStatus.VALIDADO;
        assessment.ReviewedBy = string.IsNullOrWhiteSpace(reviewedBy) ? "Revisor técnico" : reviewedBy.Trim();
        assessment.ReviewedAt = DateTime.UtcNow;
        assessment.UpdatedAt = DateTime.UtcNow;

        _db.AuditLogs.Add(new AuditLog
        {
            AssessmentId = assessmentId,
            Actor = assessment.ReviewedBy,
            Action = "AVALIACAO_VALIDADA",
            Note = $"Classificação final: {finalClassification}."
        });

        var lastVersion = await _db.AssessmentRevisions
            .Where(r => r.AssessmentId == assessmentId)
            .OrderByDescending(r => r.Version)
            .Select(r => r.Version)
            .FirstOrDefaultAsync(ct);

        _db.AssessmentRevisions.Add(new AssessmentRevision
        {
            AssessmentId = assessmentId,
            Version = lastVersion + 1,
            FinalClassification = finalClassification,
            FinalRobustness = finalRobustness,
            FinalCriticality = finalCriticality,
            FinalInfoSufficiency = finalInfoSufficiency,
            FinalJustification = assessment.FinalJustification,
            ReviewedBy = assessment.ReviewedBy
        });

        if (saveAsTemplate && !string.IsNullOrEmpty(themeId))
        {
            _db.JustificationTemplates.Add(new JustificationTemplate
            {
                ThemeId = themeId,
                OrganizationId = installation.OrganizationId,
                Title = string.IsNullOrWhiteSpace(templateTitle) ? $"Modelo — {finalClassification}" : templateTitle.Trim(),
                Text = assessment.FinalJustification,
                CreatedBy = assessment.ReviewedBy
            });
        }

        await _db.SaveChangesAsync(ct);
    }

    public async Task AddCommentAsync(string installationId, string assessmentId, string author, string text, CancellationToken ct = default)
    {
        await _gate.AssertOwnershipAsync(installationId, ct);
        var assessment = await _db.Assessments.FirstOrDefaultAsync(a => a.Id == assessmentId, ct);
        if (assessment is null || assessment.InstallationId != installationId)
            throw new KeyNotFoundException("Avaliação não encontrada nesta instalação.");
        if (string.IsNullOrWhiteSpace(author) || string.IsNullOrWhiteSpace(text))
            throw new InvalidOperationException("Autor e texto são obrigatórios.");

        _db.Comments.Add(new Comment { AssessmentId = assessmentId, Author = author.Trim(), Text = text.Trim() });
        await _db.SaveChangesAsync(ct);
    }
}
