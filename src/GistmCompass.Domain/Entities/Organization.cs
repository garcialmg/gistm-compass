using GistmCompass.Domain.Enums;

namespace GistmCompass.Domain.Entities;

public class Organization
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<AppUser> Users { get; set; } = new List<AppUser>();
    public ICollection<Installation> Installations { get; set; } = new List<Installation>();
    public ICollection<JustificationTemplate> JustificationTemplates { get; set; } = new List<JustificationTemplate>();
}

/// <summary>
/// Identity user profile fields mirrored onto Domain for ownership checks.
/// The EF Identity entity lives in Infrastructure and maps to this shape.
/// </summary>
public class AppUser
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Email { get; set; } = string.Empty;
    public string Name { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.MEMBER;
    public string OrganizationId { get; set; } = string.Empty;
    public Organization? Organization { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class Installation
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Name { get; set; } = string.Empty;
    public string OrganizationId { get; set; } = string.Empty;
    public Organization? Organization { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<DocumentFile> Documents { get; set; } = new List<DocumentFile>();
    public ICollection<Assessment> Assessments { get; set; } = new List<Assessment>();
    public ICollection<Cycle> Cycles { get; set; } = new List<Cycle>();
    public ICollection<ExternalAnalysis> ExternalAnalyses { get; set; } = new List<ExternalAnalysis>();
}

public class Cycle
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Name { get; set; } = string.Empty;
    public string InstallationId { get; set; } = string.Empty;
    public Installation? Installation { get; set; }
    public DateTime StartedAt { get; set; } = DateTime.UtcNow;
    public DateTime? ClosedAt { get; set; }
    public ICollection<Assessment> Assessments { get; set; } = new List<Assessment>();
    public bool IsClosed => ClosedAt.HasValue;
}
