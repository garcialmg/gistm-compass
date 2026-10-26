using GistmCompass.Application.Abstractions;
using GistmCompass.Application.Services;
using GistmCompass.Infrastructure.Ai;
using GistmCompass.Infrastructure.Extraction;
using GistmCompass.Infrastructure.Identity;
using GistmCompass.Infrastructure.Persistence;
using GistmCompass.Infrastructure.Queue;
using GistmCompass.Infrastructure.Storage;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace GistmCompass.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddGistmInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        var provider = config["Database:Provider"] ?? "Sqlite";
        services.AddDbContext<AppDbContext>(options =>
        {
            if (string.Equals(provider, "SqlServer", StringComparison.OrdinalIgnoreCase))
            {
                options.UseSqlServer(config.GetConnectionString("Default")
                    ?? "Server=(localdb)\\mssqllocaldb;Database=GistmCompass;Trusted_Connection=True;TrustServerCertificate=True");
            }
            else
            {
                var cs = config.GetConnectionString("Default")
                    ?? "Data Source=App_Data/gistm.db";
                EnsureSqliteDirectory(cs);
                options.UseSqlite(cs);
            }
        });
        services.AddScoped<IAppDbContext>(sp => sp.GetRequiredService<AppDbContext>());

        services
            .AddIdentity<ApplicationUser, IdentityRole>(options =>
            {
                options.Password.RequiredLength = 8;
                options.Password.RequireNonAlphanumeric = false;
                options.Password.RequireUppercase = false;
                options.Password.RequireLowercase = false;
                options.Password.RequireDigit = false;
                options.Lockout.MaxFailedAccessAttempts = 5;
                options.Lockout.DefaultLockoutTimeSpan = TimeSpan.FromMinutes(15);
                options.Lockout.AllowedForNewUsers = true;
                options.User.RequireUniqueEmail = true;
            })
            .AddEntityFrameworkStores<AppDbContext>()
            .AddDefaultTokenProviders();

        var storageProvider = config["Storage:Provider"] ?? "Local";
        if (string.Equals(storageProvider, "Azure", StringComparison.OrdinalIgnoreCase))
            services.AddSingleton<IObjectStorage, AzureBlobObjectStorage>();
        else
            services.AddSingleton<IObjectStorage, LocalObjectStorage>();

        var queueProvider = config["Queue:Provider"] ?? "InMemory";
        if (string.Equals(queueProvider, "Azure", StringComparison.OrdinalIgnoreCase))
            services.AddSingleton<IJobQueue, AzureQueueJobQueue>();
        else
            services.AddSingleton<IJobQueue, InMemoryJobQueue>();

        services.AddSingleton<HeuristicAiAssessmentService>();
        services.AddHttpClient("anthropic");
        if (!string.IsNullOrWhiteSpace(config["Anthropic:ApiKey"]))
            services.AddScoped<IAiAssessmentService, AnthropicAiAssessmentService>();
        else
            services.AddScoped<IAiAssessmentService, HeuristicAiAssessmentService>();

        services.AddScoped<ITextExtractionService, TextExtractionService>();
        services.AddScoped<IInstallationGate, InstallationGate>();
        services.AddScoped<InstallationService>();
        services.AddScoped<AssessmentService>();
        services.AddScoped<DocumentService>();
        services.AddScoped<ActionPlanService>();
        services.AddScoped<CycleService>();
        services.AddScoped<DashboardService>();

        return services;
    }

    private static void EnsureSqliteDirectory(string connectionString)
    {
        const string marker = "Data Source=";
        var idx = connectionString.IndexOf(marker, StringComparison.OrdinalIgnoreCase);
        if (idx < 0) return;
        var path = connectionString[(idx + marker.Length)..].Split(';')[0].Trim();
        if (string.IsNullOrWhiteSpace(path) || path is ":memory:" || path.Contains("Mode=Memory", StringComparison.OrdinalIgnoreCase))
            return;
        var dir = Path.GetDirectoryName(Path.GetFullPath(path));
        if (!string.IsNullOrEmpty(dir))
            Directory.CreateDirectory(dir);
    }
}
