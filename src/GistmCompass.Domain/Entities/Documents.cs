namespace GistmCompass.Domain.Entities;

public class DocumentFile
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Title { get; set; } = string.Empty;
    public string Type { get; set; } = "Documento";
    public string? Version { get; set; }
    public string? AreaResponsible { get; set; }
    public string Confidentiality { get; set; } = "INTERNO";
    public DateTime? ValidUntil { get; set; }
    public string FileName { get; set; } = string.Empty;
    /// <summary>Object storage key or relative path.</summary>
    public string StorageKey { get; set; } = string.Empty;
    public string MimeType { get; set; } = "application/octet-stream";
    public string? ExtractedText { get; set; }
    public string InstallationId { get; set; } = string.Empty;
    public Installation? Installation { get; set; }
    public DateTime UploadedAt { get; set; } = DateTime.UtcNow;
    public string? TargetAudience { get; set; }
    public bool DisclosureApproved { get; set; }
    public string? DisclosureApprovedBy { get; set; }
    public DateTime? DisclosureApprovedAt { get; set; }
    public string? PreviousVersionId { get; set; }
    public DocumentFile? PreviousVersion { get; set; }
    public ICollection<DocumentFile> NextVersions { get; set; } = new List<DocumentFile>();
    public ICollection<Evidence> Evidences { get; set; } = new List<Evidence>();
    public JobStatusTextExtraction TextExtractionStatus { get; set; } = JobStatusTextExtraction.Pending;
}

public enum JobStatusTextExtraction
{
    Pending,
    Running,
    Done,
    Failed
}

public class Evidence
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string DocumentId { get; set; } = string.Empty;
    public DocumentFile? Document { get; set; }
    public string RequirementId { get; set; } = string.Empty;
    public Requirement? Requirement { get; set; }
    public string Excerpt { get; set; } = string.Empty;
    public bool AiGenerated { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ExternalAnalysis
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string InstallationId { get; set; } = string.Empty;
    public Installation? Installation { get; set; }
    public string RequirementId { get; set; } = string.Empty;
    public Requirement? Requirement { get; set; }
    public string Source { get; set; } = string.Empty;
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class JustificationTemplate
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string ThemeId { get; set; } = string.Empty;
    public Theme? Theme { get; set; }
    public string OrganizationId { get; set; } = string.Empty;
    public Organization? Organization { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public string CreatedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
