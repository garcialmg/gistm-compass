using System.Text.Json;
using GistmCompass.Domain.Entities;
using GistmCompass.Infrastructure.Identity;
using GistmCompass.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace GistmCompass.Infrastructure.Seed;

public static class GistmContentSeeder
{
    private sealed record TopicDto(int Number, string Name, string NameEn);
    private sealed record ThemeDto(int Number, int TopicNumber, string Name, string NameEn);
    private sealed record RequirementDto(string Code, int ThemeNumber, string Description, string DescriptionEn);

    private sealed record ContentFile(List<TopicDto> Topics, List<ThemeDto> Themes, List<RequirementDto> Requirements);

    public static async Task SeedAsync(IServiceProvider services, CancellationToken ct = default)
    {
        using var scope = services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var logger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("GistmContentSeeder");
        var userManager = scope.ServiceProvider.GetRequiredService<UserManager<ApplicationUser>>();

        // Prefer migrations when present; fall back to EnsureCreated for blank SQLite demos.
        try { await db.Database.MigrateAsync(ct); }
        catch { await db.Database.EnsureCreatedAsync(ct); }

        if (!await db.Principles.AnyAsync(ct))
        {
            var jsonPath = FindContentPath();
            logger.LogInformation("Seeding GISTM catalog from {Path}", jsonPath);
            var json = await File.ReadAllTextAsync(jsonPath, ct);
            var content = JsonSerializer.Deserialize<ContentFile>(json, new JsonSerializerOptions
            {
                PropertyNameCaseInsensitive = true
            }) ?? throw new InvalidOperationException("gistm-content.json inválido");

            var principleIds = new Dictionary<int, string>();
            foreach (var t in content.Topics.OrderBy(x => x.Number))
            {
                var p = new Principle { Number = t.Number, Name = t.Name, NameEn = t.NameEn };
                db.Principles.Add(p);
                principleIds[t.Number] = p.Id;
            }
            await db.SaveChangesAsync(ct);

            var themeIds = new Dictionary<int, string>();
            foreach (var th in content.Themes.OrderBy(x => x.Number))
            {
                var theme = new Theme
                {
                    Number = th.Number,
                    Name = th.Name,
                    NameEn = th.NameEn,
                    PrincipleId = principleIds[th.TopicNumber]
                };
                db.Themes.Add(theme);
                themeIds[th.Number] = theme.Id;
            }
            await db.SaveChangesAsync(ct);

            foreach (var r in content.Requirements)
            {
                var title = FirstSentence(r.Description, 120);
                var titleEn = FirstSentence(r.DescriptionEn, 120);
                db.Requirements.Add(new Requirement
                {
                    Code = r.Code,
                    Title = title,
                    Description = r.Description,
                    TitleEn = titleEn,
                    DescriptionEn = r.DescriptionEn,
                    ThemeId = themeIds[r.ThemeNumber]
                });
            }
            await db.SaveChangesAsync(ct);
            logger.LogInformation("Seeded {Topics} topics, {Themes} themes, {Reqs} requirements",
                content.Topics.Count, content.Themes.Count, content.Requirements.Count);
        }

        if (!await db.Organizations.AnyAsync(ct))
        {
            var org = new Organization { Name = "Organização Demonstrativa" };
            db.Organizations.Add(org);
            await db.SaveChangesAsync(ct);

            var user = new ApplicationUser
            {
                UserName = "demo@gistmcompass.com",
                Email = "demo@gistmcompass.com",
                EmailConfirmed = true,
                Name = "Usuário Demonstração",
                Role = Domain.Enums.UserRole.ADMIN,
                OrganizationId = org.Id
            };
            var result = await userManager.CreateAsync(user, "demo12345");
            if (!result.Succeeded)
                logger.LogWarning("Demo user create failed: {Errors}", string.Join(", ", result.Errors.Select(e => e.Description)));

            var year = DateTime.UtcNow.Year;
            foreach (var name in new[] { "Barragem Norte", "Barragem Sul", "Estrutura Central" })
            {
                var inst = new Installation { Name = name, OrganizationId = org.Id };
                db.Installations.Add(inst);
                db.Cycles.Add(new Cycle { Name = $"Ciclo {year}.1", InstallationId = inst.Id });
            }
            await db.SaveChangesAsync(ct);
        }
    }

    private static string FindContentPath()
    {
        var candidates = new[]
        {
            Path.Combine(AppContext.BaseDirectory, "Seed", "gistm-content.json"),
            Path.Combine(AppContext.BaseDirectory, "gistm-content.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "Seed", "gistm-content.json"),
            Path.Combine(Directory.GetCurrentDirectory(), "..", "GistmCompass.Infrastructure", "Seed", "gistm-content.json"),
            Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "GistmCompass.Infrastructure", "Seed", "gistm-content.json")),
            Path.GetFullPath(Path.Combine(Directory.GetCurrentDirectory(), "src", "GistmCompass.Infrastructure", "Seed", "gistm-content.json")),
            "/workspace/src/GistmCompass.Infrastructure/Seed/gistm-content.json"
        };
        foreach (var c in candidates)
            if (File.Exists(c)) return c;

        // Fallback: extract embedded resource
        var asm = typeof(GistmContentSeeder).Assembly;
        var name = asm.GetManifestResourceNames().FirstOrDefault(n => n.EndsWith("gistm-content.json", StringComparison.OrdinalIgnoreCase));
        if (name is not null)
        {
            var temp = Path.Combine(Path.GetTempPath(), "gistm-content.json");
            using var stream = asm.GetManifestResourceStream(name)!;
            using var fs = File.Create(temp);
            stream.CopyTo(fs);
            return temp;
        }
        throw new FileNotFoundException("gistm-content.json não encontrado. Embutir como Content no csproj.");
    }

    private static string FirstSentence(string text, int maxLen)
    {
        var dot = text.IndexOf(". ", StringComparison.Ordinal);
        if (dot > 0 && dot < maxLen) return text[..(dot + 1)];
        return text.Length <= maxLen ? text : text[..maxLen].Trim() + "…";
    }
}
