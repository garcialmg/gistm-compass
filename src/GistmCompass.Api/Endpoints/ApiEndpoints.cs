using System.Security.Claims;
using GistmCompass.Application.Abstractions;
using GistmCompass.Application.Services;
using GistmCompass.Domain.Enums;
using GistmCompass.Infrastructure.Identity;
using GistmCompass.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace GistmCompass.Api.Endpoints;

public static class ApiEndpoints
{
    public static void MapGistmEndpoints(this WebApplication app)
    {
        app.MapGet("/health", () => Results.Ok(new { status = "ok", service = "GistmCompass.Api" }));

        var auth = app.MapGroup("/api/auth");
        auth.MapPost("/register", RegisterAsync);
        auth.MapPost("/login", LoginAsync);
        auth.MapPost("/logout", async (SignInManager<ApplicationUser> signIn) =>
        {
            await signIn.SignOutAsync();
            return Results.Ok();
        }).RequireAuthorization();
        auth.MapGet("/me", (ICurrentUserAccessor current) =>
        {
            if (current.User is null) return Results.Unauthorized();
            return Results.Ok(current.User);
        }).RequireAuthorization();

        var installations = app.MapGroup("/api/installations").RequireAuthorization();
        installations.MapGet("/", async (InstallationService svc, CancellationToken ct) =>
        {
            var list = await svc.ListAsync(ct);
            return Results.Ok(list.Select(i => new { i.Id, i.Name, i.OrganizationId, i.CreatedAt }));
        });
        installations.MapPost("/", async (CreateInstallationRequest req, InstallationService svc, CancellationToken ct) =>
        {
            var created = await svc.CreateAsync(req.Name, req.Location, ct);
            return Results.Created($"/api/installations/{created.Id}", new { created.Id, created.Name, created.OrganizationId, created.CreatedAt });
        });
        installations.MapDelete("/{id}", async (string id, InstallationService svc, CancellationToken ct) =>
        {
            try
            {
                await svc.DeleteAsync(id, ct);
                return Results.NoContent();
            }
            catch (KeyNotFoundException) { return Results.NotFound(); }
            catch (UnauthorizedAccessException) { return Results.Forbid(); }
        });
        installations.MapGet("/{id}", async (string id, IInstallationGate gate, CancellationToken ct) =>
        {
            try
            {
                var ctx = await gate.GetInstallationContextAsync(id, ct: ct);
                return Results.Ok(new
                {
                    installation = new { ctx.Installation.Id, ctx.Installation.Name, ctx.Installation.OrganizationId, ctx.Installation.CreatedAt },
                    cycle = new { ctx.Cycle.Id, ctx.Cycle.Name, ctx.Cycle.StartedAt, ctx.Cycle.ClosedAt },
                    ctx.IsLatestCycle,
                    cycles = ctx.AllCycles.Select(c => new { c.Id, c.Name, c.StartedAt, c.ClosedAt })
                });
            }
            catch (KeyNotFoundException) { return Results.NotFound(); }
        });

        installations.MapGet("/{id}/dashboard", async (string id, string? cycleId, DashboardService svc, CancellationToken ct) =>
        {
            try { return Results.Ok(await svc.GetAsync(id, cycleId, ct)); }
            catch (KeyNotFoundException) { return Results.NotFound(); }
        });

        installations.MapPost("/{id}/cycles/close", async (string id, CycleService svc, CancellationToken ct) =>
        {
            try { await svc.CloseAndStartNextAsync(id, ct); return Results.Ok(); }
            catch (KeyNotFoundException) { return Results.NotFound(); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { error = ex.Message }); }
        });

        var docs = installations.MapGroup("/{installationId}/documents");
        docs.MapGet("/", async (string installationId, DocumentService svc, CancellationToken ct) =>
        {
            try { return Results.Ok(await svc.ListAsync(installationId, ct)); }
            catch (KeyNotFoundException) { return Results.NotFound(); }
        });
        docs.MapPost("/", UploadDocumentAsync);
        docs.MapGet("/{documentId}/download", DownloadDocumentAsync);
        docs.MapDelete("/{documentId}", async (string installationId, string documentId, DocumentService svc, CancellationToken ct) =>
        {
            try { await svc.DeleteAsync(installationId, documentId, ct); return Results.NoContent(); }
            catch (KeyNotFoundException) { return Results.NotFound(); }
        });

        var reqs = app.MapGroup("/api/requirements").RequireAuthorization();
        reqs.MapGet("/", async (AppDbContext db, CancellationToken ct) =>
            Results.Ok(await db.Requirements.Include(r => r.Theme).ThenInclude(t => t!.Principle)
                .OrderBy(r => r.Code).Select(r => new
                {
                    r.Id, r.Code, r.Title, r.Description, r.TitleEn, r.DescriptionEn,
                    ThemeId = r.ThemeId, ThemeNumber = r.Theme!.Number, PrincipleNumber = r.Theme.Principle!.Number
                }).ToListAsync(ct)));

        var assessments = installations.MapGroup("/{installationId}/assessments");
        assessments.MapGet("/", ListAssessmentsAsync);
        assessments.MapGet("/{requirementId}", GetAssessmentAsync);
        assessments.MapPost("/{requirementId}/ai", async (string installationId, string requirementId, AssessmentService svc, CancellationToken ct) =>
        {
            try
            {
                await svc.EnqueueAiAsync(installationId, requirementId, ct);
                // Also run synchronously for offline demo reliability
                await svc.ApplyAiSuggestionAsync(installationId, requirementId, useRealAi: false, ct);
                return Results.Ok(new { status = "DONE" });
            }
            catch (KeyNotFoundException) { return Results.NotFound(); }
            catch (InvalidOperationException ex) { return Results.BadRequest(new { error = ex.Message }); }
        });
        assessments.MapPost("/{requirementId}/validate", ValidateAssessmentAsync);
        assessments.MapPost("/{requirementId}/comments", AddCommentAsync);

        var actions = installations.MapGroup("/{installationId}/actions");
        actions.MapGet("/", async (string installationId, string? cycleId, ActionPlanService svc, CancellationToken ct) =>
        {
            try { return Results.Ok(await svc.ListAsync(installationId, cycleId, ct)); }
            catch (KeyNotFoundException) { return Results.NotFound(); }
        });
        actions.MapPost("/", CreateActionAsync);

        var users = app.MapGroup("/api/organization/users").RequireAuthorization();
        users.MapGet("/", ListUsersAsync);
        users.MapPost("/", CreateUserAsync);
    }

    private static async Task<IResult> RegisterAsync(
        RegisterRequest req,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signIn,
        AppDbContext db,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.OrgName) || string.IsNullOrWhiteSpace(req.Email) ||
            string.IsNullOrWhiteSpace(req.Password) || string.IsNullOrWhiteSpace(req.Name))
            return Results.BadRequest(new { error = "Preencha todos os campos." });

        if (await userManager.FindByEmailAsync(req.Email) is not null)
            return Results.BadRequest(new { error = "Email já cadastrado." });

        var org = new Domain.Entities.Organization { Name = req.OrgName.Trim() };
        db.Organizations.Add(org);
        await db.SaveChangesAsync(ct);

        var user = new ApplicationUser
        {
            UserName = req.Email.Trim().ToLowerInvariant(),
            Email = req.Email.Trim().ToLowerInvariant(),
            EmailConfirmed = true,
            Name = req.Name.Trim(),
            Role = UserRole.ADMIN,
            OrganizationId = org.Id
        };
        var result = await userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return Results.BadRequest(new { error = string.Join("; ", result.Errors.Select(e => e.Description)) });

        await SignInWithClaimsAsync(signIn, user);
        return Results.Ok(new { user.Id, user.Email, user.OrganizationId, role = user.Role.ToString() });
    }

    private static async Task<IResult> LoginAsync(
        LoginRequest req,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signIn)
    {
        var user = await userManager.FindByEmailAsync(req.Email.Trim().ToLowerInvariant());
        if (user is null)
            return Results.Unauthorized();

        var result = await signIn.CheckPasswordSignInAsync(user, req.Password, lockoutOnFailure: true);
        if (result.IsLockedOut)
            return Results.Json(new { error = "Conta temporariamente bloqueada. Tente novamente em 15 minutos." }, statusCode: 423);
        if (!result.Succeeded)
            return Results.Unauthorized();

        await SignInWithClaimsAsync(signIn, user);
        return Results.Ok(new { user.Id, user.Email, user.OrganizationId, role = user.Role.ToString(), name = user.Name });
    }

    private static async Task SignInWithClaimsAsync(SignInManager<ApplicationUser> signIn, ApplicationUser user)
    {
        var extra = new List<Claim>
        {
            new("organizationId", user.OrganizationId),
            new("orgRole", user.Role.ToString()),
            new("name", user.Name)
        };
        await signIn.SignInWithClaimsAsync(user, isPersistent: true, extra);
    }

    private static async Task<IResult> UploadDocumentAsync(
        string installationId,
        HttpRequest request,
        DocumentService svc,
        CancellationToken ct)
    {
        if (!request.HasFormContentType) return Results.BadRequest();
        var form = await request.ReadFormAsync(ct);
        var file = form.Files.GetFile("file");
        if (file is null || file.Length == 0) return Results.BadRequest(new { error = "Selecione um arquivo." });
        await using var stream = file.OpenReadStream();
        try
        {
            var doc = await svc.UploadAsync(
                installationId,
                form["title"].ToString(),
                form["type"].ToString(),
                form["version"].ToString(),
                form["areaResponsible"].ToString(),
                form["confidentiality"].ToString(),
                form["targetAudience"].ToString(),
                DateTime.TryParse(form["validUntil"], out var vu) ? vu : null,
                form["previousVersionId"].ToString(),
                file.FileName,
                file.ContentType,
                stream,
                ct);
            return Results.Created($"/api/installations/{installationId}/documents/{doc.Id}", doc);
        }
        catch (KeyNotFoundException) { return Results.NotFound(); }
        catch (InvalidOperationException ex) { return Results.BadRequest(new { error = ex.Message }); }
    }

    private static async Task<IResult> DownloadDocumentAsync(
        string installationId,
        string documentId,
        DocumentService svc,
        CancellationToken ct)
    {
        try
        {
            var (doc, stream) = await svc.DownloadAsync(documentId, ct);
            if (doc.InstallationId != installationId) return Results.NotFound();
            return Results.File(stream, doc.MimeType, doc.FileName);
        }
        catch (KeyNotFoundException) { return Results.NotFound(); }
    }

    private static async Task<IResult> ListAssessmentsAsync(
        string installationId, string? cycleId, IInstallationGate gate, AppDbContext db, CancellationToken ct)
    {
        try
        {
            var ctx = await gate.GetInstallationContextAsync(installationId, cycleId, ct);
            var list = await db.Assessments
                .Where(a => a.InstallationId == installationId && a.CycleId == ctx.Cycle.Id)
                .Select(a => new
                {
                    a.Id, a.RequirementId, a.Status, a.AiClassification, a.FinalClassification,
                    a.AiConfidence, a.AiJobStatus, a.ReviewedBy, a.ReviewedAt
                }).ToListAsync(ct);
            return Results.Ok(list);
        }
        catch (KeyNotFoundException) { return Results.NotFound(); }
    }

    private static async Task<IResult> GetAssessmentAsync(
        string installationId, string requirementId, string? cycleId,
        IInstallationGate gate, AppDbContext db, AssessmentService assessments, CancellationToken ct)
    {
        try
        {
            var ctx = await gate.GetInstallationContextAsync(installationId, cycleId, ct);
            var a = await assessments.GetOrCreateAsync(requirementId, installationId, ctx.Cycle.Id, ct);
            var full = await db.Assessments
                .Include(x => x.Comments)
                .Include(x => x.Revisions)
                .Include(x => x.AuditLogs)
                .Include(x => x.Actions)
                .FirstAsync(x => x.Id == a.Id, ct);
            var templates = await db.JustificationTemplates
                .Where(t => t.OrganizationId == ctx.User.OrganizationId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync(ct);
            var evidences = await db.Evidences
                .Include(e => e.Document)
                .Where(e => e.RequirementId == requirementId && e.Document!.InstallationId == installationId)
                .ToListAsync(ct);
            return Results.Ok(new { assessment = full, templates, evidences, isLatestCycle = ctx.IsLatestCycle });
        }
        catch (KeyNotFoundException) { return Results.NotFound(); }
    }

    private static async Task<IResult> ValidateAssessmentAsync(
        string installationId, string requirementId, ValidateRequest req, AssessmentService svc, CancellationToken ct)
    {
        try
        {
            await svc.ValidateAsync(
                installationId, req.AssessmentId, requirementId, req.ThemeId,
                req.FinalClassification, req.FinalRobustness, req.FinalCriticality, req.FinalInfoSufficiency,
                req.FinalJustification, req.ReviewedBy ?? "Revisor técnico",
                req.SaveAsTemplate, req.TemplateTitle, ct);
            return Results.Ok();
        }
        catch (KeyNotFoundException) { return Results.NotFound(); }
        catch (InvalidOperationException ex) { return Results.BadRequest(new { error = ex.Message }); }
    }

    private static async Task<IResult> AddCommentAsync(
        string installationId, string requirementId, CommentRequest req, AssessmentService svc, AppDbContext db, IInstallationGate gate, CancellationToken ct)
    {
        try
        {
            var ctx = await gate.GetInstallationContextAsync(installationId, ct: ct);
            var a = await svc.GetOrCreateAsync(requirementId, installationId, ctx.Cycle.Id, ct);
            await svc.AddCommentAsync(installationId, a.Id, req.Author, req.Text, ct);
            return Results.Ok();
        }
        catch (KeyNotFoundException) { return Results.NotFound(); }
        catch (InvalidOperationException ex) { return Results.BadRequest(new { error = ex.Message }); }
    }

    private static async Task<IResult> CreateActionAsync(
        string installationId, CreateActionRequest req, ActionPlanService svc, CancellationToken ct)
    {
        try
        {
            var action = await svc.CreateAsync(installationId, req.AssessmentId, req.Description, req.Responsible,
                req.Area, req.DueDate, req.Priority, req.DependsOnId, ct);
            return Results.Created($"/api/installations/{installationId}/actions/{action.Id}", action);
        }
        catch (KeyNotFoundException) { return Results.NotFound(); }
        catch (InvalidOperationException ex) { return Results.BadRequest(new { error = ex.Message }); }
    }

    private static async Task<IResult> ListUsersAsync(
        ICurrentUserAccessor current, UserManager<ApplicationUser> users, CancellationToken ct)
    {
        if (current.User is null) return Results.Unauthorized();
        if (current.User.Role != UserRole.ADMIN) return Results.Forbid();
        var list = users.Users.Where(u => u.OrganizationId == current.User.OrganizationId)
            .Select(u => new { u.Id, u.Email, u.Name, role = u.Role.ToString(), u.CreatedAt });
        return Results.Ok(await list.ToListAsync(ct));
    }

    private static async Task<IResult> CreateUserAsync(
        CreateUserRequest req, ICurrentUserAccessor current, UserManager<ApplicationUser> userManager)
    {
        if (current.User is null) return Results.Unauthorized();
        if (current.User.Role != UserRole.ADMIN) return Results.Forbid();
        var user = new ApplicationUser
        {
            UserName = req.Email.Trim().ToLowerInvariant(),
            Email = req.Email.Trim().ToLowerInvariant(),
            EmailConfirmed = true,
            Name = req.Name.Trim(),
            Role = req.Role,
            OrganizationId = current.User.OrganizationId
        };
        var result = await userManager.CreateAsync(user, req.Password);
        if (!result.Succeeded)
            return Results.BadRequest(new { error = string.Join("; ", result.Errors.Select(e => e.Description)) });
        return Results.Ok(new { user.Id, user.Email, role = user.Role.ToString() });
    }

    public record RegisterRequest(string OrgName, string Name, string Email, string Password);
    public record LoginRequest(string Email, string Password);
    public record CreateInstallationRequest(string Name, string? Location);
    public record ValidateRequest(
        string AssessmentId, string? ThemeId,
        FinalClassification FinalClassification, EvidenceRobustness FinalRobustness,
        GapCriticality FinalCriticality, InfoSufficiency FinalInfoSufficiency,
        string FinalJustification, string? ReviewedBy, bool SaveAsTemplate, string? TemplateTitle);
    public record CommentRequest(string Author, string Text);
    public record CreateActionRequest(
        string AssessmentId, string Description, string Responsible, string? Area,
        DateTime? DueDate, ActionPriority Priority, string? DependsOnId);
    public record CreateUserRequest(string Name, string Email, string Password, UserRole Role);
}
