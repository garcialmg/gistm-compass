using GistmCompass.Application.Abstractions;
using GistmCompass.Domain.Entities;
using GistmCompass.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace GistmCompass.Application.Services;

public interface IAppDbContext
{
    DbSet<Organization> Organizations { get; }
    DbSet<Installation> Installations { get; }
    DbSet<Cycle> Cycles { get; }
    DbSet<Principle> Principles { get; }
    DbSet<Theme> Themes { get; }
    DbSet<Requirement> Requirements { get; }
    DbSet<DocumentFile> Documents { get; }
    DbSet<Evidence> Evidences { get; }
    DbSet<Assessment> Assessments { get; }
    DbSet<Comment> Comments { get; }
    DbSet<AssessmentRevision> AssessmentRevisions { get; }
    DbSet<AuditLog> AuditLogs { get; }
    DbSet<ActionItem> Actions { get; }
    DbSet<ActionComment> ActionComments { get; }
    DbSet<ActionLog> ActionLogs { get; }
    DbSet<ExternalAnalysis> ExternalAnalyses { get; }
    DbSet<JustificationTemplate> JustificationTemplates { get; }
    DbSet<BackgroundJob> BackgroundJobs { get; }
    Task<int> SaveChangesAsync(CancellationToken ct = default);
}

public class InstallationService
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;
    private readonly IObjectStorage _storage;

    public InstallationService(IAppDbContext db, ICurrentUserAccessor current, IObjectStorage storage)
    {
        _db = db;
        _current = current;
        _storage = storage;
    }

    private CurrentUser RequireUser() =>
        _current.User ?? throw new UnauthorizedAccessException("Não autenticado.");

    public async Task<IReadOnlyList<Installation>> ListAsync(CancellationToken ct = default)
    {
        var user = RequireUser();
        return await _db.Installations
            .Where(i => i.OrganizationId == user.OrganizationId)
            .OrderBy(i => i.Name)
            .ToListAsync(ct);
    }

    public async Task<Installation> CreateAsync(string name, string? location, CancellationToken ct = default)
    {
        var user = RequireUser();
        if (string.IsNullOrWhiteSpace(name))
            throw new InvalidOperationException("Informe o nome da instalação/estrutura.");

        var installation = new Installation
        {
            Name = string.IsNullOrWhiteSpace(location) ? name.Trim() : $"{name.Trim()} — {location.Trim()}",
            OrganizationId = user.OrganizationId
        };
        _db.Installations.Add(installation);

        var year = DateTime.UtcNow.Year;
        _db.Cycles.Add(new Cycle
        {
            Name = $"Ciclo {year}.1",
            InstallationId = installation.Id
        });

        await _db.SaveChangesAsync(ct);
        return installation;
    }

    public async Task DeleteAsync(string installationId, CancellationToken ct = default)
    {
        var user = RequireUser();
        if (user.Role != UserRole.ADMIN)
            throw new UnauthorizedAccessException("Apenas administradores da organização podem remover instalações.");

        var installation = await _db.Installations.FirstOrDefaultAsync(i => i.Id == installationId, ct);
        if (installation is null || installation.OrganizationId != user.OrganizationId)
            throw new KeyNotFoundException("Instalação não encontrada.");

        var assessmentIds = await _db.Assessments.Where(a => a.InstallationId == installationId).Select(a => a.Id).ToListAsync(ct);
        var actionIds = await _db.Actions.Where(a => assessmentIds.Contains(a.AssessmentId)).Select(a => a.Id).ToListAsync(ct);
        var documents = await _db.Documents.Where(d => d.InstallationId == installationId).ToListAsync(ct);

        _db.ActionComments.RemoveRange(_db.ActionComments.Where(c => actionIds.Contains(c.ActionId)));
        _db.ActionLogs.RemoveRange(_db.ActionLogs.Where(l => actionIds.Contains(l.ActionId)));
        _db.Comments.RemoveRange(_db.Comments.Where(c => assessmentIds.Contains(c.AssessmentId)));
        _db.AssessmentRevisions.RemoveRange(_db.AssessmentRevisions.Where(r => assessmentIds.Contains(r.AssessmentId)));
        _db.AuditLogs.RemoveRange(_db.AuditLogs.Where(l => assessmentIds.Contains(l.AssessmentId)));
        _db.Actions.RemoveRange(_db.Actions.Where(a => assessmentIds.Contains(a.AssessmentId)));
        _db.Evidences.RemoveRange(_db.Evidences.Where(e => documents.Select(d => d.Id).Contains(e.DocumentId)));
        _db.ExternalAnalyses.RemoveRange(_db.ExternalAnalyses.Where(e => e.InstallationId == installationId));
        _db.Assessments.RemoveRange(_db.Assessments.Where(a => a.InstallationId == installationId));
        _db.Documents.RemoveRange(documents);
        _db.Cycles.RemoveRange(_db.Cycles.Where(c => c.InstallationId == installationId));
        _db.Installations.Remove(installation);
        await _db.SaveChangesAsync(ct);

        foreach (var doc in documents)
        {
            try { await _storage.DeleteAsync(doc.StorageKey, ct); } catch { /* orphan cleanup best-effort */ }
        }
    }
}

public class InstallationGate : IInstallationGate
{
    private readonly IAppDbContext _db;
    private readonly ICurrentUserAccessor _current;

    public InstallationGate(IAppDbContext db, ICurrentUserAccessor current)
    {
        _db = db;
        _current = current;
    }

    public async Task<Installation> AssertOwnershipAsync(string installationId, CancellationToken ct = default)
    {
        var user = _current.User ?? throw new UnauthorizedAccessException("Não autenticado.");
        var installation = await _db.Installations.FirstOrDefaultAsync(i => i.Id == installationId, ct);
        if (installation is null || installation.OrganizationId != user.OrganizationId)
            throw new KeyNotFoundException("Instalação não encontrada.");
        return installation;
    }

    public async Task<InstallationContext> GetInstallationContextAsync(string installationId, string? cycleId = null, CancellationToken ct = default)
    {
        var user = _current.User ?? throw new UnauthorizedAccessException("Não autenticado.");
        var installation = await AssertOwnershipAsync(installationId, ct);

        var allCycles = await _db.Cycles
            .Where(c => c.InstallationId == installationId)
            .OrderByDescending(c => c.StartedAt)
            .ToListAsync(ct);

        Cycle? cycle = null;
        if (!string.IsNullOrEmpty(cycleId))
            cycle = allCycles.FirstOrDefault(c => c.Id == cycleId);
        else
            cycle = allCycles.FirstOrDefault();

        if (cycle is null)
            throw new KeyNotFoundException("Ciclo não encontrado.");

        return new InstallationContext
        {
            Installation = installation,
            Cycle = cycle,
            AllCycles = allCycles,
            IsLatestCycle = allCycles.Count > 0 && allCycles[0].Id == cycle.Id,
            User = user
        };
    }
}
