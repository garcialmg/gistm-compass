using GistmCompass.Application.Abstractions;
using GistmCompass.Domain.Entities;
using GistmCompass.Domain.Enums;
using Microsoft.EntityFrameworkCore;
using System.Text.Json;

namespace GistmCompass.Application.Services;

public class DocumentService
{
    private readonly IAppDbContext _db;
    private readonly IInstallationGate _gate;
    private readonly IObjectStorage _storage;
    private readonly IJobQueue _queue;

    public DocumentService(IAppDbContext db, IInstallationGate gate, IObjectStorage storage, IJobQueue queue)
    {
        _db = db;
        _gate = gate;
        _storage = storage;
        _queue = queue;
    }

    public static string BuildStorageKey(string organizationId, string installationId, string documentId, string fileName) =>
        $"org/{organizationId}/installation/{installationId}/{documentId}/{fileName}";

    public async Task<IReadOnlyList<DocumentFile>> ListAsync(string installationId, CancellationToken ct = default)
    {
        await _gate.AssertOwnershipAsync(installationId, ct);
        return await _db.Documents
            .Where(d => d.InstallationId == installationId)
            .OrderByDescending(d => d.UploadedAt)
            .ToListAsync(ct);
    }

    public async Task<DocumentFile> UploadAsync(
        string installationId,
        string title,
        string type,
        string? version,
        string? areaResponsible,
        string confidentiality,
        string? targetAudience,
        DateTime? validUntil,
        string? previousVersionId,
        string originalFileName,
        string mimeType,
        Stream content,
        CancellationToken ct = default)
    {
        var installation = await _gate.AssertOwnershipAsync(installationId, ct);
        if (string.IsNullOrWhiteSpace(title))
            throw new InvalidOperationException("Informe um título para o documento.");

        var ext = Path.GetExtension(originalFileName).ToLowerInvariant();
        var allowed = new[] { ".pdf", ".docx", ".xlsx", ".txt", ".md", ".doc", ".xls", ".png", ".jpg", ".jpeg" };
        if (!allowed.Contains(ext))
            throw new InvalidOperationException($"Extensão não permitida: {ext}");

        var doc = new DocumentFile
        {
            Title = title.Trim(),
            Type = string.IsNullOrWhiteSpace(type) ? "Documento" : type.Trim(),
            Version = string.IsNullOrWhiteSpace(version) ? null : version.Trim(),
            AreaResponsible = string.IsNullOrWhiteSpace(areaResponsible) ? null : areaResponsible.Trim(),
            Confidentiality = string.IsNullOrWhiteSpace(confidentiality) ? "INTERNO" : confidentiality,
            TargetAudience = string.IsNullOrWhiteSpace(targetAudience) ? null : targetAudience.Trim(),
            ValidUntil = validUntil,
            PreviousVersionId = string.IsNullOrWhiteSpace(previousVersionId) ? null : previousVersionId,
            FileName = originalFileName,
            MimeType = string.IsNullOrWhiteSpace(mimeType) ? "application/octet-stream" : mimeType,
            InstallationId = installationId,
            TextExtractionStatus = JobStatusTextExtraction.Pending
        };

        var storedName = $"{Guid.NewGuid():N}{ext}";
        doc.StorageKey = BuildStorageKey(installation.OrganizationId, installationId, doc.Id, storedName);

        await _storage.UploadAsync(doc.StorageKey, content, doc.MimeType, ct);
        _db.Documents.Add(doc);

        var job = new BackgroundJob
        {
            Type = JobType.TextExtraction,
            Status = JobStatus.PENDING,
            OrganizationId = installation.OrganizationId,
            InstallationId = installationId,
            PayloadJson = JsonSerializer.Serialize(new { documentId = doc.Id, extension = ext })
        };
        _db.BackgroundJobs.Add(job);
        await _db.SaveChangesAsync(ct);
        await _queue.EnqueueAsync(job, ct);
        return doc;
    }

    public async Task<(DocumentFile Doc, Stream Stream)> DownloadAsync(string documentId, CancellationToken ct = default)
    {
        var doc = await _db.Documents.Include(d => d.Installation).FirstOrDefaultAsync(d => d.Id == documentId, ct)
            ?? throw new KeyNotFoundException("Documento não encontrado.");
        await _gate.AssertOwnershipAsync(doc.InstallationId, ct);
        var stream = await _storage.DownloadAsync(doc.StorageKey, ct);
        return (doc, stream);
    }

    public async Task DeleteAsync(string installationId, string documentId, CancellationToken ct = default)
    {
        await _gate.AssertOwnershipAsync(installationId, ct);
        var doc = await _db.Documents.FirstOrDefaultAsync(d => d.Id == documentId && d.InstallationId == installationId, ct)
            ?? throw new KeyNotFoundException("Documento não encontrado.");
        var evidences = _db.Evidences.Where(e => e.DocumentId == documentId);
        _db.Evidences.RemoveRange(evidences);
        _db.Documents.Remove(doc);
        await _db.SaveChangesAsync(ct);
        try { await _storage.DeleteAsync(doc.StorageKey, ct); } catch { /* best effort */ }
    }
}
