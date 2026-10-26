using GistmCompass.Domain.Enums;

namespace GistmCompass.Domain.Entities;

public class Assessment
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string RequirementId { get; set; } = string.Empty;
    public Requirement? Requirement { get; set; }
    public string InstallationId { get; set; } = string.Empty;
    public Installation? Installation { get; set; }
    public string CycleId { get; set; } = string.Empty;
    public Cycle? Cycle { get; set; }

    // AI suggestion — never becomes final without human review
    public FinalClassification? AiClassification { get; set; }
    public EvidenceRobustness? AiRobustness { get; set; }
    public GapCriticality? AiCriticality { get; set; }
    public InfoSufficiency? AiInfoSufficiency { get; set; }
    public string? AiJustification { get; set; }
    public double? AiConfidence { get; set; }

    // Human final decision
    public FinalClassification? FinalClassification { get; set; }
    public EvidenceRobustness? FinalRobustness { get; set; }
    public GapCriticality? FinalCriticality { get; set; }
    public InfoSufficiency? FinalInfoSufficiency { get; set; }
    public string? FinalJustification { get; set; }

    public ReviewStatus Status { get; set; } = ReviewStatus.SUGESTAO_IA;
    public string? ReviewedBy { get; set; }
    public DateTime? ReviewedAt { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    public JobStatus AiJobStatus { get; set; } = JobStatus.DONE;

    public ICollection<ActionItem> Actions { get; set; } = new List<ActionItem>();
    public ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
    public ICollection<Comment> Comments { get; set; } = new List<Comment>();
    public ICollection<AssessmentRevision> Revisions { get; set; } = new List<AssessmentRevision>();
}

public class Comment
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string AssessmentId { get; set; } = string.Empty;
    public Assessment? Assessment { get; set; }
    public string Author { get; set; } = string.Empty;
    public string Text { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class AssessmentRevision
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string AssessmentId { get; set; } = string.Empty;
    public Assessment? Assessment { get; set; }
    public int Version { get; set; }
    public FinalClassification FinalClassification { get; set; }
    public EvidenceRobustness FinalRobustness { get; set; }
    public GapCriticality FinalCriticality { get; set; }
    public InfoSufficiency FinalInfoSufficiency { get; set; }
    public string FinalJustification { get; set; } = string.Empty;
    public string ReviewedBy { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}

public class AuditLog
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string AssessmentId { get; set; } = string.Empty;
    public Assessment? Assessment { get; set; }
    public string Actor { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty;
    public string? Note { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
