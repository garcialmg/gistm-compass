using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using GistmCompass.Api.Endpoints;
using Microsoft.AspNetCore.Mvc.Testing;

namespace GistmCompass.Tests;

public class TenantIsolationTests : IClassFixture<GistmApiFactory>
{
    private readonly GistmApiFactory _factory;

    public TenantIsolationTests(GistmApiFactory factory) => _factory = factory;

    [Fact]
    public async Task Health_is_public()
    {
        var client = _factory.CreateClient();
        var res = await client.GetAsync("/health");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
    }

    [Fact]
    public async Task Cross_org_installation_returns_404()
    {
        var clientA = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });
        var clientB = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });

        var suffix = Guid.NewGuid().ToString("N")[..8];
        var regA = await clientA.PostAsJsonAsync("/api/auth/register", new ApiEndpoints.RegisterRequest(
            $"OrgA-{suffix}", "Admin A", $"admin-a-{suffix}@example.com", "senhaSegura123"));
        Assert.Equal(HttpStatusCode.OK, regA.StatusCode);

        var regB = await clientB.PostAsJsonAsync("/api/auth/register", new ApiEndpoints.RegisterRequest(
            $"OrgB-{suffix}", "Admin B", $"admin-b-{suffix}@example.com", "senhaSegura123"));
        Assert.Equal(HttpStatusCode.OK, regB.StatusCode);

        var create = await clientA.PostAsJsonAsync("/api/installations/", new ApiEndpoints.CreateInstallationRequest("Barragem A", null));
        Assert.Equal(HttpStatusCode.Created, create.StatusCode);
        using var createdDoc = JsonDocument.Parse(await create.Content.ReadAsStringAsync());
        var installationId = createdDoc.RootElement.GetProperty("id").GetString();
        Assert.False(string.IsNullOrEmpty(installationId));

        var listB = await clientB.GetAsync("/api/installations/");
        Assert.Equal(HttpStatusCode.OK, listB.StatusCode);
        var listJson = await listB.Content.ReadAsStringAsync();
        Assert.DoesNotContain("Barragem A", listJson);

        var cross = await clientB.GetAsync($"/api/installations/{installationId}");
        Assert.Equal(HttpStatusCode.NotFound, cross.StatusCode);

        var crossDash = await clientB.GetAsync($"/api/installations/{installationId}/dashboard");
        Assert.Equal(HttpStatusCode.NotFound, crossDash.StatusCode);
    }

    [Fact]
    public async Task Member_cannot_delete_installation()
    {
        var admin = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });
        var suffix = Guid.NewGuid().ToString("N")[..8];
        await admin.PostAsJsonAsync("/api/auth/register", new ApiEndpoints.RegisterRequest(
            $"OrgDel-{suffix}", "Admin", $"admin-del-{suffix}@example.com", "senhaSegura123"));

        var create = await admin.PostAsJsonAsync("/api/installations/", new ApiEndpoints.CreateInstallationRequest("Para Remover", null));
        using var createdDoc = JsonDocument.Parse(await create.Content.ReadAsStringAsync());
        var installationId = createdDoc.RootElement.GetProperty("id").GetString()!;

        var memberCreate = await admin.PostAsJsonAsync("/api/organization/users/", new ApiEndpoints.CreateUserRequest(
            "Membro", $"member-{suffix}@example.com", "senhaSegura123", Domain.Enums.UserRole.MEMBER));
        Assert.Equal(HttpStatusCode.OK, memberCreate.StatusCode);

        var member = _factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });
        var login = await member.PostAsJsonAsync("/api/auth/login", new ApiEndpoints.LoginRequest($"member-{suffix}@example.com", "senhaSegura123"));
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);

        var del = await member.DeleteAsync($"/api/installations/{installationId}");
        Assert.Equal(HttpStatusCode.Forbidden, del.StatusCode);
    }

    [Fact]
    public async Task Unauthenticated_api_returns_401()
    {
        var client = _factory.CreateClient(new WebApplicationFactoryClientOptions { AllowAutoRedirect = false });
        var res = await client.GetAsync("/api/installations/");
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }
}

public class GistmApiFactory : WebApplicationFactory<Program>
{
    private readonly string _dbPath = Path.Combine(Path.GetTempPath(), $"gistm-test-{Guid.NewGuid():N}.db");
    private readonly string _uploadRoot = Path.Combine(Path.GetTempPath(), $"gistm-uploads-{Guid.NewGuid():N}");

    protected override void ConfigureWebHost(Microsoft.AspNetCore.Hosting.IWebHostBuilder builder)
    {
        Directory.CreateDirectory(Path.GetDirectoryName(_dbPath)!);
        Directory.CreateDirectory(_uploadRoot);
        builder.UseSetting("Database:Provider", "Sqlite");
        builder.UseSetting("ConnectionStrings:Default", $"Data Source={_dbPath}");
        builder.UseSetting("Storage:Provider", "Local");
        builder.UseSetting("Storage:LocalRoot", _uploadRoot);
        builder.UseSetting("Queue:Provider", "InMemory");
        builder.UseSetting("Anthropic:ApiKey", "");
        builder.UseSetting("environment", "Development");
    }

    protected override void Dispose(bool disposing)
    {
        base.Dispose(disposing);
        try { if (File.Exists(_dbPath)) File.Delete(_dbPath); } catch { /* ignore */ }
        try { if (Directory.Exists(_uploadRoot)) Directory.Delete(_uploadRoot, true); } catch { /* ignore */ }
    }
}
