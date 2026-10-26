using GistmCompass.Domain.Enums;

namespace GistmCompass.Domain.Entities;

public class ActionItem
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string AssessmentId { get; set; } = string.Empty;
    public Assessment? Assessment { get; set; }
    public string Description { get; set; } = string.Empty;
    public string Responsible { get; set; } = string.Empty;
    public string? Area { get; set; }
    public DateTime? DueDate { get; set; }
    public ActionPriority Priority { get; set; } = ActionPriority.MEDIA;
    public ActionStatus Status { get; set; } = ActionStatus.ABERTA;
    public string? ClosureEvidence { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public string? DependsOnId { get; set; }
    public ActionItem? DependsOn { get; set; }
    public ICollection<ActionItem> Blocks { get; set; } = new List<ActionItem>();
    public ICollection<ActionComment> Comments { get; set; } = new List<ActionComment>();
    public ICollection<ActionLog> Logs { get; set; } = new List<ActionLog>();
}

public class ActionComment
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string ActionId { get; set; } = string.Empty;
    public ActionItem? Action { get; set; }
    public string Author { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class ActionLog
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string ActionId { get; set; } = string.Empty;
    public ActionItem? Action { get; set; }
    public string Actor { get; set; } = string.Empty;
    public string Event { get; set; } = string.Empty;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class BackgroundJob
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public JobType Type { get; set; }
    public JobStatus Status { get; set; } = JobStatus.PENDING;
    public string PayloadJson { get; set; } = "{}";
    public string? Error { get; set; }
    public string? OrganizationId { get; set; }
    public string? InstallationId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? StartedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
}
