using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace GistmCompass.Infrastructure.Persistence;

/// <summary>
/// Factory para <c>dotnet ef</c>. Lê a connection string do host (Web/Api) quando possível.
/// </summary>
public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var basePath = FindHostContentRoot();
        var config = new ConfigurationBuilder()
            .SetBasePath(basePath)
            .AddJsonFile("appsettings.json", optional: true)
            .AddJsonFile("appsettings.Development.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var provider = config["Database:Provider"] ?? "SqlServer";
        var cs = config.GetConnectionString("Default")
            ?? Environment.GetEnvironmentVariable("GISTM_DESIGN_CS")
            ?? "Server=localhost\\SQLEXPRESS;Database=GistmCompass;Trusted_Connection=True;TrustServerCertificate=True";

        var options = new DbContextOptionsBuilder<AppDbContext>();
        if (string.Equals(provider, "Sqlite", StringComparison.OrdinalIgnoreCase))
            options.UseSqlite(cs);
        else
            options.UseSqlServer(cs);

        return new AppDbContext(options.Options);
    }

    private static string FindHostContentRoot()
    {
        var cwd = Directory.GetCurrentDirectory();
        var candidates = new[]
        {
            cwd,
            Path.Combine(cwd, "src", "GistmCompass.Web"),
            Path.Combine(cwd, "src", "GistmCompass.Api"),
            Path.GetFullPath(Path.Combine(cwd, "..", "GistmCompass.Web")),
            Path.GetFullPath(Path.Combine(cwd, "..", "GistmCompass.Api")),
        };
        foreach (var c in candidates)
        {
            if (File.Exists(Path.Combine(c, "appsettings.json")))
                return c;
        }
        return cwd;
    }
}
