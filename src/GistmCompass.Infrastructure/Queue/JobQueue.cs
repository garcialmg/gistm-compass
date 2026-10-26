using System.Collections.Concurrent;
using System.Text.Json;
using Azure.Storage.Queues;
using GistmCompass.Application.Abstractions;
using GistmCompass.Domain.Entities;
using GistmCompass.Domain.Enums;
using GistmCompass.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace GistmCompass.Infrastructure.Queue;

/// <summary>In-memory / file-backed queue for local/dev — also persists jobs in DB.</summary>
public class InMemoryJobQueue : IJobQueue
{
    private readonly ConcurrentQueue<string> _ids = new();
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly string? _spillPath;

    public InMemoryJobQueue(IServiceScopeFactory scopeFactory, IConfiguration config)
    {
        _scopeFactory = scopeFactory;
        _spillPath = config["Queue:FilePath"];
        if (!string.IsNullOrEmpty(_spillPath))
        {
            Directory.CreateDirectory(Path.GetDirectoryName(Path.GetFullPath(_spillPath))!);
            if (File.Exists(_spillPath))
            {
                foreach (var line in File.ReadAllLines(_spillPath))
                    if (!string.IsNullOrWhiteSpace(line)) _ids.Enqueue(line.Trim());
            }
        }
    }

    public async Task EnqueueAsync(BackgroundJob job, CancellationToken ct = default)
    {
        _ids.Enqueue(job.Id);
        if (!string.IsNullOrEmpty(_spillPath))
            await File.AppendAllTextAsync(_spillPath, job.Id + Environment.NewLine, ct);
    }

    public async Task<BackgroundJob?> DequeueAsync(CancellationToken ct = default)
    {
        if (!_ids.TryDequeue(out var id)) return null;
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var job = await db.BackgroundJobs.FirstOrDefaultAsync(j => j.Id == id && j.Status == JobStatus.PENDING, ct);
        return job;
    }
}

public class AzureQueueJobQueue : IJobQueue
{
    private readonly QueueClient _client;
    private readonly IServiceScopeFactory _scopeFactory;

    public AzureQueueJobQueue(IConfiguration config, IServiceScopeFactory scopeFactory)
    {
        var cs = config["Queue:Azure:ConnectionString"]
            ?? throw new InvalidOperationException("Queue:Azure:ConnectionString não configurado.");
        var name = config["Queue:Azure:QueueName"] ?? "gistm-jobs";
        _client = new QueueClient(cs, name);
        _client.CreateIfNotExists();
        _scopeFactory = scopeFactory;
    }

    public async Task EnqueueAsync(BackgroundJob job, CancellationToken ct = default)
    {
        var payload = Convert.ToBase64String(System.Text.Encoding.UTF8.GetBytes(job.Id));
        await _client.SendMessageAsync(payload, cancellationToken: ct);
    }

    public async Task<BackgroundJob?> DequeueAsync(CancellationToken ct = default)
    {
        var response = await _client.ReceiveMessagesAsync(1, TimeSpan.FromSeconds(30), ct);
        var msg = response.Value.FirstOrDefault();
        if (msg is null) return null;
        var id = System.Text.Encoding.UTF8.GetString(Convert.FromBase64String(msg.MessageText));
        await _client.DeleteMessageAsync(msg.MessageId, msg.PopReceipt, ct);
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        return await db.BackgroundJobs.FirstOrDefaultAsync(j => j.Id == id && j.Status == JobStatus.PENDING, ct);
    }
}
