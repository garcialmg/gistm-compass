using GistmCompass.Domain.Entities;
using GistmCompass.Domain.Enums;
using GistmCompass.Domain.Services;

namespace GistmCompass.Application.Abstractions;

public interface IObjectStorage
{
    Task UploadAsync(string key, Stream content, string contentType, CancellationToken ct = default);
    Task<Stream> DownloadAsync(string key, CancellationToken ct = default);
    Task DeleteAsync(string key, CancellationToken ct = default);
    Task<bool> ExistsAsync(string key, CancellationToken ct = default);
    /// <summary>Returns a time-limited URL when supported (Azure SAS); local returns a relative app path.</summary>
    Task<string> GetReadUrlAsync(string key, TimeSpan ttl, CancellationToken ct = default);
    Task<string> GetUploadUrlAsync(string key, TimeSpan ttl, CancellationToken ct = default);
}

public interface IJobQueue
{
    Task EnqueueAsync(BackgroundJob job, CancellationToken ct = default);
    Task<BackgroundJob?> DequeueAsync(CancellationToken ct = default);
}

public interface ITextExtractionService
{
    Task<string?> ExtractAsync(Stream content, string extension, CancellationToken ct = default);
}

public interface IAiAssessmentService
{
    Task<AiSimulator.Suggestion> AssessAsync(
        AiSimulator.RequirementInput requirement,
        IReadOnlyList<AiSimulator.DocumentInput> documents,
        string? priorExternalAnalysis,
        CancellationToken ct = default);
}

public sealed record CurrentUser(string UserId, string Email, string Name, string OrganizationId, UserRole Role);

public interface ICurrentUserAccessor
{
    CurrentUser? User { get; }
}

public sealed class InstallationContext
{
    public required Installation Installation { get; init; }
    public required Cycle Cycle { get; init; }
    public required IReadOnlyList<Cycle> AllCycles { get; init; }
    public required bool IsLatestCycle { get; init; }
    public required CurrentUser User { get; init; }
}

public interface IInstallationGate
{
    Task<InstallationContext> GetInstallationContextAsync(string installationId, string? cycleId = null, CancellationToken ct = default);
    Task<Installation> AssertOwnershipAsync(string installationId, CancellationToken ct = default);
}
