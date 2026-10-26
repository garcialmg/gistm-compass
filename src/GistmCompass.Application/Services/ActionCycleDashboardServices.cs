using GistmCompass.Application.Abstractions;
using GistmCompass.Domain.Entities;
using GistmCompass.Domain.Enums;
using GistmCompass.Domain.Services;
using Microsoft.EntityFrameworkCore;

namespace GistmCompass.Application.Services;

public class ActionPlanService
{
    private readonly IAppDbContext _db;
    private readonly IInstallationGate _gate;

    public ActionPlanService(IAppDbContext db, IInstallationGate gate)
    {
        _db = db;
        _gate = gate;
    }

    public async Task<IReadOnlyList<ActionItem>> ListAsync(string installationId, string? cycleId = null, CancellationToken ct = default)
    {
        var ctx = await _gate.GetInstallationContextAsync(installationId, cycleId, ct);
        return await _db.Actions
            .Include(a => a.Comments)
            .Include(a => a.Logs)
            .Include(a => a.DependsOn)
            .Where(a => a.Assessment!.InstallationId == installationId && a.Assessment.CycleId == ctx.Cycle.Id)
            .OrderByDescending(a => a.CreatedAt)
            .ToListAsync(ct);
    }

    public async Task<ActionItem> CreateAsync(
        string installationId,
        string assessmentId,
        string description,
        string responsible,
        string? area,
        DateTime? dueDate,
        ActionPriority priority,
        string? dependsOnId,
        CancellationToken ct = default)
    {
        var ctx = await _gate.GetInstallationContextAsync(installationId, ct: ct);
        if (!ctx.IsLatestCycle)
            throw new InvalidOperationException("Ciclo encerrado — somente leitura.");

        var assessment = await _db.Assessments.FirstOrDefaultAsync(a => a.Id == assessmentId, ct);
        if (assessment is null || assessment.InstallationId != installationId)
            throw new KeyNotFoundException("Avaliação não encontrada.");

        var action = new ActionItem
        {
            AssessmentId = assessmentId,
            Description = description.Trim(),
            Responsible = responsible.Trim(),
            Area = area,
            DueDate = dueDate,
            Priority = priority,
            DependsOnId = string.IsNullOrWhiteSpace(dependsOnId) ? null : dependsOnId
        };
        _db.Actions.Add(action);
        _db.ActionLogs.Add(new ActionLog
        {
            ActionId = action.Id,
            Actor = ctx.User.Name,
            Event = "CRIADA",
            Note = action.Description
        });
        await _db.SaveChangesAsync(ct);
        return action;
    }

    public async Task UpdateStatusAsync(string installationId, string actionId, ActionStatus status, string actor, string? note, CancellationToken ct = default)
    {
        var ctx = await _gate.GetInstallationContextAsync(installationId, ct: ct);
        if (!ctx.IsLatestCycle)
            throw new InvalidOperationException("Ciclo encerrado — somente leitura.");

        var action = await _db.Actions.Include(a => a.Assessment).FirstOrDefaultAsync(a => a.Id == actionId, ct);
        if (action?.Assessment is null || action.Assessment.InstallationId != installationId)
            throw new KeyNotFoundException("Ação não encontrada.");

        action.Status = status;
        action.UpdatedAt = DateTime.UtcNow;
        _db.ActionLogs.Add(new ActionLog
        {
            ActionId = actionId,
            Actor = actor,
            Event = $"STATUS_{status}",
            Note = note
        });
        await _db.SaveChangesAsync(ct);
    }

    public async Task AddCommentAsync(string installationId, string actionId, string author, string text, CancellationToken ct = default)
    {
        await _gate.AssertOwnershipAsync(installationId, ct);
        var action = await _db.Actions.Include(a => a.Assessment).FirstOrDefaultAsync(a => a.Id == actionId, ct);
        if (action?.Assessment is null || action.Assessment.InstallationId != installationId)
            throw new KeyNotFoundException("Ação não encontrada.");

        _db.ActionComments.Add(new ActionComment { ActionId = actionId, Author = author.Trim(), Text = text.Trim() });
        await _db.SaveChangesAsync(ct);
    }
}

public class CycleService
{
    private readonly IAppDbContext _db;
    private readonly IInstallationGate _gate;

    public CycleService(IAppDbContext db, IInstallationGate gate)
    {
        _db = db;
        _gate = gate;
    }

    public async Task CloseAndStartNextAsync(string installationId, CancellationToken ct = default)
    {
        var ctx = await _gate.GetInstallationContextAsync(installationId, ct: ct);
        if (!ctx.IsLatestCycle)
            throw new InvalidOperationException("O ciclo selecionado já não é o ativo.");

        ctx.Cycle.ClosedAt = DateTime.UtcNow;
        var parts = ctx.Cycle.Name.Split('.');
        var nextSuffix = 1;
        if (parts.Length == 2 && int.TryParse(parts[1], out var n))
            nextSuffix = n + 1;
        var year = DateTime.UtcNow.Year;
        _db.Cycles.Add(new Cycle
        {
            Name = $"Ciclo {year}.{nextSuffix}",
            InstallationId = installationId
        });
        await _db.SaveChangesAsync(ct);
    }
}

public sealed record DashboardDto(
    string CycleName,
    int ValidatedCount,
    int TotalRequirements,
    double? CompliancePct,
    int CriticalGaps,
    int OverdueActions,
    int ExpiredDocuments,
    int PendingAiReview,
    int ReadinessScore,
    string ReadinessLabel,
    IReadOnlyList<PrincipleBreakdownDto> Principles);

public sealed record PrincipleBreakdownDto(int Number, string Name, double? Pct, int ValidatedCount);

public class DashboardService
{
    private readonly IAppDbContext _db;
    private readonly IInstallationGate _gate;

    public DashboardService(IAppDbContext db, IInstallationGate gate)
    {
        _db = db;
        _gate = gate;
    }

    public async Task<DashboardDto> GetAsync(string installationId, string? cycleId = null, CancellationToken ct = default)
    {
        var ctx = await _gate.GetInstallationContextAsync(installationId, cycleId, ct);
        var totalRequirements = await _db.Requirements.CountAsync(ct);
        var principles = await _db.Principles
            .Include(p => p.Themes).ThenInclude(t => t.Requirements)
            .OrderBy(p => p.Number)
            .ToListAsync(ct);

        var validated = await _db.Assessments
            .Where(a => a.InstallationId == installationId && a.CycleId == ctx.Cycle.Id && a.Status == ReviewStatus.VALIDADO)
            .ToListAsync(ct);

        var criticalGaps = validated.Count(a => a.FinalCriticality == GapCriticality.ALTA);
        var overdueActions = await _db.Actions.CountAsync(a =>
            a.Status != ActionStatus.CONCLUIDA &&
            a.DueDate != null && a.DueDate < DateTime.UtcNow &&
            a.Assessment!.InstallationId == installationId &&
            a.Assessment.CycleId == ctx.Cycle.Id, ct);
        var expiredDocuments = await _db.Documents.CountAsync(d =>
            d.InstallationId == installationId && d.ValidUntil != null && d.ValidUntil < DateTime.UtcNow, ct);
        var pendingAiReview = await _db.Assessments.CountAsync(a =>
            a.InstallationId == installationId && a.CycleId == ctx.Cycle.Id && a.Status == ReviewStatus.EM_REVISAO, ct);

        var naoSeAplica = validated.Count(a => a.FinalClassification == FinalClassification.NAO_SE_APLICA);
        var totalmente = validated.Count(a => a.FinalClassification == FinalClassification.ATENDE_TOTALMENTE);
        var applicable = validated.Count - naoSeAplica;
        double? compliance = applicable > 0 ? Math.Round((double)totalmente / applicable * 100) : null;

        var readiness = ReadinessScore.Compute(new ReadinessScore.Input(
            validated.Count, totalRequirements, compliance, criticalGaps, overdueActions, expiredDocuments, pendingAiReview));

        var breakdown = principles.Select(p =>
        {
            var reqIds = p.Themes.SelectMany(t => t.Requirements).Select(r => r.Id).ToHashSet();
            var pAssessments = validated.Where(a => reqIds.Contains(a.RequirementId)).ToList();
            var pApplicable = pAssessments.Where(a => a.FinalClassification != FinalClassification.NAO_SE_APLICA).ToList();
            var pCompliant = pAssessments.Where(a => a.FinalClassification == FinalClassification.ATENDE_TOTALMENTE).ToList();
            double? pct = pApplicable.Count > 0 ? pCompliant.Count * 100.0 / pApplicable.Count : null;
            return new PrincipleBreakdownDto(p.Number, p.Name, pct, pAssessments.Count);
        }).ToList();

        return new DashboardDto(
            ctx.Cycle.Name,
            validated.Count,
            totalRequirements,
            compliance,
            criticalGaps,
            overdueActions,
            expiredDocuments,
            pendingAiReview,
            readiness,
            ReadinessScore.Label(readiness),
            breakdown);
    }
}
