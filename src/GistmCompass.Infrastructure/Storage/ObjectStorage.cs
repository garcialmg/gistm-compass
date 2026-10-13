using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;
using GistmCompass.Application.Abstractions;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace GistmCompass.Infrastructure.Storage;

public class LocalObjectStorage : IObjectStorage
{
    private readonly string _root;
    private readonly ILogger<LocalObjectStorage> _logger;

    public LocalObjectStorage(IConfiguration config, ILogger<LocalObjectStorage> logger)
    {
        _root = config["Storage:LocalRoot"] ?? Path.Combine(Directory.GetCurrentDirectory(), "App_Data", "uploads");
        Directory.CreateDirectory(_root);
        _logger = logger;
    }

    private string FullPath(string key)
    {
        var safe = key.Replace('\\', '/').TrimStart('/');
        var full = Path.GetFullPath(Path.Combine(_root, safe.Replace('/', Path.DirectorySeparatorChar)));
        if (!full.StartsWith(Path.GetFullPath(_root), StringComparison.Ordinal))
            throw new InvalidOperationException("Chave de armazenamento inválida.");
        return full;
    }

    public async Task UploadAsync(string key, Stream content, string contentType, CancellationToken ct = default)
    {
        var path = FullPath(key);
        Directory.CreateDirectory(Path.GetDirectoryName(path)!);
        await using var fs = File.Create(path);
        await content.CopyToAsync(fs, ct);
        _logger.LogDebug("Local upload {Key}", key);
    }

    public Task<Stream> DownloadAsync(string key, CancellationToken ct = default)
    {
        var path = FullPath(key);
        Stream stream = File.OpenRead(path);
        return Task.FromResult(stream);
    }

    public Task DeleteAsync(string key, CancellationToken ct = default)
    {
        var path = FullPath(key);
        if (File.Exists(path)) File.Delete(path);
        return Task.CompletedTask;
    }

    public Task<bool> ExistsAsync(string key, CancellationToken ct = default) =>
        Task.FromResult(File.Exists(FullPath(key)));

    public Task<string> GetReadUrlAsync(string key, TimeSpan ttl, CancellationToken ct = default) =>
        Task.FromResult($"/local-blob/{Uri.EscapeDataString(key)}");

    public Task<string> GetUploadUrlAsync(string key, TimeSpan ttl, CancellationToken ct = default) =>
        Task.FromResult($"/local-blob/{Uri.EscapeDataString(key)}");
}

public class AzureBlobObjectStorage : IObjectStorage
{
    private readonly BlobContainerClient _container;

    public AzureBlobObjectStorage(IConfiguration config)
    {
        var connection = config["Storage:Azure:ConnectionString"]
            ?? throw new InvalidOperationException("Storage:Azure:ConnectionString não configurado.");
        var container = config["Storage:Azure:Container"] ?? "gistm";
        _container = new BlobContainerClient(connection, container);
        _container.CreateIfNotExists(PublicAccessType.None);
    }

    public async Task UploadAsync(string key, Stream content, string contentType, CancellationToken ct = default)
    {
        var blob = _container.GetBlobClient(key);
        await blob.UploadAsync(content, new BlobHttpHeaders { ContentType = contentType }, cancellationToken: ct);
    }

    public async Task<Stream> DownloadAsync(string key, CancellationToken ct = default)
    {
        var blob = _container.GetBlobClient(key);
        var response = await blob.DownloadStreamingAsync(cancellationToken: ct);
        return response.Value.Content;
    }

    public async Task DeleteAsync(string key, CancellationToken ct = default)
    {
        await _container.DeleteBlobIfExistsAsync(key, cancellationToken: ct);
    }

    public async Task<bool> ExistsAsync(string key, CancellationToken ct = default)
    {
        var blob = _container.GetBlobClient(key);
        return await blob.ExistsAsync(ct);
    }

    public Task<string> GetReadUrlAsync(string key, TimeSpan ttl, CancellationToken ct = default)
    {
        var blob = _container.GetBlobClient(key);
        if (!blob.CanGenerateSasUri)
            throw new InvalidOperationException("Conta sem suporte a SAS.");
        var sas = blob.GenerateSasUri(BlobSasPermissions.Read, DateTimeOffset.UtcNow.Add(ttl));
        return Task.FromResult(sas.ToString());
    }

    public Task<string> GetUploadUrlAsync(string key, TimeSpan ttl, CancellationToken ct = default)
    {
        var blob = _container.GetBlobClient(key);
        if (!blob.CanGenerateSasUri)
            throw new InvalidOperationException("Conta sem suporte a SAS.");
        var sas = blob.GenerateSasUri(BlobSasPermissions.Create | BlobSasPermissions.Write, DateTimeOffset.UtcNow.Add(ttl));
        return Task.FromResult(sas.ToString());
    }
}
