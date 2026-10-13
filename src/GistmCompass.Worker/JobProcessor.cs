using System.Text.Json;
using GistmCompass.Application.Abstractions;
using GistmCompass.Application.Services;
using GistmCompass.Domain.Entities;
using GistmCompass.Domain.Enums;
using GistmCompass.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace GistmCompass.Worker;

public class JobProcessor
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<JobProcessor> _logger;

    public JobProcessor(IServiceScopeFactory scopeFactory, ILogger<JobProcessor> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    public async Task ProcessAsync(BackgroundJob job, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var tracked = await db.BackgroundJobs.FirstOrDefaultAsync(j => j.Id == job.Id, ct);
        if (tracked is null) return;

        tracked.Status = JobStatus.RUNNING;
        tracked.StartedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        try
        {
            switch (tracked.Type)
            {
                case JobType.TextExtraction:
                    await RunTextExtractionAsync(scope.ServiceProvider, tracked, ct);
                    break;
                case JobType.AiAssessment:
                    await RunAiAssessmentAsync(scope.ServiceProvider, tracked, ct);
                    break;
                case JobType.AiAssessmentBatch:
                    await RunAiBatchAsync(scope.ServiceProvider, tracked, ct);
                    break;
                default:
                    _logger.LogWarning("Job type {Type} not implemented", tracked.Type);
                    break;
            }

            tracked.Status = JobStatus.DONE;
            tracked.CompletedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Job {Id} failed", tracked.Id);
            tracked.Status = JobStatus.FAILED;
            tracked.Error = ex.Message;
            tracked.CompletedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
        }
    }

    private static async Task RunTextExtractionAsync(IServiceProvider sp, BackgroundJob job, CancellationToken ct)
    {
        using var payload = JsonDocument.Parse(job.PayloadJson);
        var documentId = payload.RootElement.GetProperty("documentId").GetString()!;
        var extension = payload.RootElement.GetProperty("extension").GetString()!;

        var db = sp.GetRequiredService<AppDbContext>();
        var storage = sp.GetRequiredService<IObjectStorage>();
        var extractor = sp.GetRequiredService<ITextExtractionService>();

        var doc = await db.Documents.FirstOrDefaultAsync(d => d.Id == documentId, ct)
            ?? throw new InvalidOperationException("Documento não encontrado.");

        doc.TextExtractionStatus = JobStatusTextExtraction.Running;
        await db.SaveChangesAsync(ct);

        await using var stream = await storage.DownloadAsync(doc.StorageKey, ct);
        var text = await extractor.ExtractAsync(stream, extension, ct);
        doc.ExtractedText = text;
        doc.TextExtractionStatus = JobStatusTextExtraction.Done;
        await db.SaveChangesAsync(ct);
    }

    private static async Task RunAiAssessmentAsync(IServiceProvider sp, BackgroundJob job, CancellationToken ct)
    {
        using var payload = JsonDocument.Parse(job.PayloadJson);
        var installationId = payload.RootElement.GetProperty("installationId").GetString()!;
        var requirementId = payload.RootElement.GetProperty("requirementId").GetString()!;

        // Worker runs without HTTP user — set a system accessor via scoped override is hard;
        // apply AI using services that need ownership. Use internal path on AssessmentService
        // by temporarily elevating via a WorkerCurrentUser set from job org.
        var accessor = sp.GetRequiredService<ICurrentUserAccessor>();
        if (accessor is WorkerCurrentUserAccessor workerUser && job.OrganizationId is not null)
        {
            workerUser.Set(new CurrentUser("worker", "worker@system", "Worker", job.OrganizationId, UserRole.ADMIN));
        }

        var assessments = sp.GetRequiredService<AssessmentService>();
        await assessments.ApplyAiSuggestionAsync(installationId, requirementId, useRealAi: true, ct);
    }

    private static async Task RunAiBatchAsync(IServiceProvider sp, BackgroundJob job, CancellationToken ct)
    {
        using var payload = JsonDocument.Parse(job.PayloadJson);
        var installationId = payload.RootElement.GetProperty("installationId").GetString()!;
        var accessor = sp.GetRequiredService<ICurrentUserAccessor>();
        if (accessor is WorkerCurrentUserAccessor workerUser && job.OrganizationId is not null)
            workerUser.Set(new CurrentUser("worker", "worker@system", "Worker", job.OrganizationId, UserRole.ADMIN));

        var db = sp.GetRequiredService<AppDbContext>();
        var assessments = sp.GetRequiredService<AssessmentService>();
        var reqIds = await db.Requirements.Select(r => r.Id).ToListAsync(ct);
        foreach (var reqId in reqIds)
            await assessments.ApplyAiSuggestionAsync(installationId, reqId, useRealAi: false, ct);
    }
}

public class WorkerCurrentUserAccessor : ICurrentUserAccessor
{
    private CurrentUser? _user;
    public CurrentUser? User => _user;
    public void Set(CurrentUser user) => _user = user;
}

public class JobQueueHostedService : BackgroundService
{
    private readonly IJobQueue _queue;
    private readonly JobProcessor _processor;
    private readonly ILogger<JobQueueHostedService> _logger;

    public JobQueueHostedService(IJobQueue queue, JobProcessor processor, ILogger<JobQueueHostedService> logger)
    {
        _queue = queue;
        _processor = processor;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("GISTM Worker listening for jobs");
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                var job = await _queue.DequeueAsync(stoppingToken);
                if (job is null)
                {
                    await Task.Delay(1000, stoppingToken);
                    continue;
                }
                await _processor.ProcessAsync(job, stoppingToken);
            }
            catch (OperationCanceledException) when (stoppingToken.IsCancellationRequested) { }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Worker loop error");
                await Task.Delay(2000, stoppingToken);
            }
        }
    }
}
