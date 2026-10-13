using GistmCompass.Application.Services;
using GistmCompass.Domain.Entities;
using GistmCompass.Infrastructure.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace GistmCompass.Infrastructure.Persistence;

public class AppDbContext : IdentityDbContext<ApplicationUser>, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Organization> Organizations => Set<Organization>();
    public DbSet<Installation> Installations => Set<Installation>();
    public DbSet<Cycle> Cycles => Set<Cycle>();
    public DbSet<Principle> Principles => Set<Principle>();
    public DbSet<Theme> Themes => Set<Theme>();
    public DbSet<Requirement> Requirements => Set<Requirement>();
    public DbSet<DocumentFile> Documents => Set<DocumentFile>();
    public DbSet<Evidence> Evidences => Set<Evidence>();
    public DbSet<Assessment> Assessments => Set<Assessment>();
    public DbSet<Comment> Comments => Set<Comment>();
    public DbSet<AssessmentRevision> AssessmentRevisions => Set<AssessmentRevision>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<ActionItem> Actions => Set<ActionItem>();
    public DbSet<ActionComment> ActionComments => Set<ActionComment>();
    public DbSet<ActionLog> ActionLogs => Set<ActionLog>();
    public DbSet<ExternalAnalysis> ExternalAnalyses => Set<ExternalAnalysis>();
    public DbSet<JustificationTemplate> JustificationTemplates => Set<JustificationTemplate>();
    public DbSet<BackgroundJob> BackgroundJobs => Set<BackgroundJob>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Organization>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Name).HasMaxLength(256).IsRequired();
        });

        builder.Entity<ApplicationUser>(e =>
        {
            e.HasIndex(x => x.OrganizationId);
            e.Property(x => x.Name).HasMaxLength(256);
            e.Property(x => x.Role).HasConversion<string>().HasMaxLength(32);
        });

        builder.Entity<Installation>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.OrganizationId);
            e.HasOne(x => x.Organization).WithMany(o => o.Installations).HasForeignKey(x => x.OrganizationId);
        });

        builder.Entity<Cycle>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Installation).WithMany(i => i.Cycles).HasForeignKey(x => x.InstallationId);
        });

        builder.Entity<Principle>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Number).IsUnique();
        });

        builder.Entity<Theme>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Number).IsUnique();
            e.HasOne(x => x.Principle).WithMany(p => p.Themes).HasForeignKey(x => x.PrincipleId);
        });

        builder.Entity<Requirement>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.Code).IsUnique();
            e.HasOne(x => x.Theme).WithMany(t => t.Requirements).HasForeignKey(x => x.ThemeId);
        });

        builder.Entity<DocumentFile>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.InstallationId);
            e.Property(x => x.ExtractedText);
            e.HasOne(x => x.Installation).WithMany(i => i.Documents).HasForeignKey(x => x.InstallationId);
            e.HasOne(x => x.PreviousVersion).WithMany(d => d.NextVersions).HasForeignKey(x => x.PreviousVersionId)
                .OnDelete(DeleteBehavior.Restrict);
            e.Property(x => x.TextExtractionStatus).HasConversion<string>().HasMaxLength(32);
        });

        builder.Entity<Evidence>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Document).WithMany(d => d.Evidences).HasForeignKey(x => x.DocumentId);
            e.HasOne(x => x.Requirement).WithMany(r => r.Evidences).HasForeignKey(x => x.RequirementId);
        });

        builder.Entity<Assessment>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.RequirementId, x.InstallationId, x.CycleId }).IsUnique();
            e.HasOne(x => x.Requirement).WithMany(r => r.Assessments).HasForeignKey(x => x.RequirementId);
            e.HasOne(x => x.Installation).WithMany(i => i.Assessments).HasForeignKey(x => x.InstallationId);
            e.HasOne(x => x.Cycle).WithMany(c => c.Assessments).HasForeignKey(x => x.CycleId);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.AiClassification).HasConversion<string>().HasMaxLength(64);
            e.Property(x => x.AiRobustness).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.AiCriticality).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.AiInfoSufficiency).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.FinalClassification).HasConversion<string>().HasMaxLength(64);
            e.Property(x => x.FinalRobustness).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.FinalCriticality).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.FinalInfoSufficiency).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.AiJobStatus).HasConversion<string>().HasMaxLength(32);
        });

        builder.Entity<Comment>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Assessment).WithMany(a => a.Comments).HasForeignKey(x => x.AssessmentId);
        });

        builder.Entity<AssessmentRevision>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.AssessmentId, x.Version }).IsUnique();
            e.HasOne(x => x.Assessment).WithMany(a => a.Revisions).HasForeignKey(x => x.AssessmentId);
            e.Property(x => x.FinalClassification).HasConversion<string>().HasMaxLength(64);
            e.Property(x => x.FinalRobustness).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.FinalCriticality).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.FinalInfoSufficiency).HasConversion<string>().HasMaxLength(32);
        });

        builder.Entity<AuditLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Assessment).WithMany(a => a.AuditLogs).HasForeignKey(x => x.AssessmentId);
        });

        builder.Entity<ActionItem>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Assessment).WithMany(a => a.Actions).HasForeignKey(x => x.AssessmentId);
            e.HasOne(x => x.DependsOn).WithMany(a => a.Blocks).HasForeignKey(x => x.DependsOnId)
                .OnDelete(DeleteBehavior.Restrict);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            e.Property(x => x.Priority).HasConversion<string>().HasMaxLength(32);
        });

        builder.Entity<ActionComment>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Action).WithMany(a => a.Comments).HasForeignKey(x => x.ActionId);
        });

        builder.Entity<ActionLog>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasOne(x => x.Action).WithMany(a => a.Logs).HasForeignKey(x => x.ActionId);
        });

        builder.Entity<ExternalAnalysis>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => new { x.InstallationId, x.RequirementId, x.Source }).IsUnique();
            e.HasOne(x => x.Installation).WithMany(i => i.ExternalAnalyses).HasForeignKey(x => x.InstallationId);
            e.HasOne(x => x.Requirement).WithMany(r => r.ExternalAnalyses).HasForeignKey(x => x.RequirementId);
        });

        builder.Entity<JustificationTemplate>(e =>
        {
            e.HasKey(x => x.Id);
            e.HasIndex(x => x.OrganizationId);
            e.HasOne(x => x.Theme).WithMany(t => t.JustificationTemplates).HasForeignKey(x => x.ThemeId);
            e.HasOne(x => x.Organization).WithMany(o => o.JustificationTemplates).HasForeignKey(x => x.OrganizationId);
        });

        builder.Entity<BackgroundJob>(e =>
        {
            e.HasKey(x => x.Id);
            e.Property(x => x.Type).HasConversion<string>().HasMaxLength(64);
            e.Property(x => x.Status).HasConversion<string>().HasMaxLength(32);
            e.HasIndex(x => x.Status);
        });
    }
}
