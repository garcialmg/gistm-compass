namespace GistmCompass.Domain.Entities;

public class Principle
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public int Number { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameEn { get; set; }
    public ICollection<Theme> Themes { get; set; } = new List<Theme>();
}

public class Theme
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public int Number { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? NameEn { get; set; }
    public string PrincipleId { get; set; } = string.Empty;
    public Principle? Principle { get; set; }
    public ICollection<Requirement> Requirements { get; set; } = new List<Requirement>();
    public ICollection<JustificationTemplate> JustificationTemplates { get; set; } = new List<JustificationTemplate>();
}

public class Requirement
{
    public string Id { get; set; } = Guid.NewGuid().ToString("N");
    public string Code { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string? TitleEn { get; set; }
    public string? DescriptionEn { get; set; }
    public string? ExpectedEvidence { get; set; }
    public string? ExpectedEvidenceEn { get; set; }
    public string ThemeId { get; set; } = string.Empty;
    public Theme? Theme { get; set; }
    public ICollection<Evidence> Evidences { get; set; } = new List<Evidence>();
    public ICollection<Assessment> Assessments { get; set; } = new List<Assessment>();
    public ICollection<ExternalAnalysis> ExternalAnalyses { get; set; } = new List<ExternalAnalysis>();
}
