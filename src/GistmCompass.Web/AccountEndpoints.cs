using System.Security.Claims;
using GistmCompass.Domain.Entities;
using GistmCompass.Domain.Enums;
using GistmCompass.Infrastructure.Identity;
using GistmCompass.Infrastructure.Persistence;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;

namespace GistmCompass.Web;

/// <summary>
/// Login/cadastro/logout via HTTP POST — SignInManager não pode gravar cookie
/// dentro do circuito Blazor Interactive Server.
/// </summary>
public static class AccountEndpoints
{
    public static void MapAccountEndpoints(this WebApplication app)
    {
        app.MapPost("/account/login", LoginAsync).DisableAntiforgery();
        app.MapPost("/account/register", RegisterAsync).DisableAntiforgery();
        app.MapPost("/account/logout", LogoutAsync).DisableAntiforgery();
    }

    private static async Task<IResult> LoginAsync(
        [FromForm] string email,
        [FromForm] string password,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signIn)
    {
        if (string.IsNullOrWhiteSpace(email) || string.IsNullOrWhiteSpace(password))
            return Results.Redirect("/login?error=" + Uri.EscapeDataString("Preencha email e senha."));

        var user = await userManager.FindByEmailAsync(email.Trim().ToLowerInvariant());
        if (user is null)
            return Results.Redirect("/login?error=" + Uri.EscapeDataString("Email ou senha incorretos."));

        var result = await signIn.CheckPasswordSignInAsync(user, password, lockoutOnFailure: true);
        if (result.IsLockedOut)
            return Results.Redirect("/login?error=" + Uri.EscapeDataString("Conta temporariamente bloqueada. Tente novamente em 15 minutos."));
        if (!result.Succeeded)
            return Results.Redirect("/login?error=" + Uri.EscapeDataString("Email ou senha incorretos."));

        await SignInWithClaimsAsync(signIn, user);
        return Results.Redirect("/instalacoes");
    }

    private static async Task<IResult> RegisterAsync(
        [FromForm] string orgName,
        [FromForm] string name,
        [FromForm] string email,
        [FromForm] string password,
        UserManager<ApplicationUser> userManager,
        SignInManager<ApplicationUser> signIn,
        AppDbContext db)
    {
        if (string.IsNullOrWhiteSpace(orgName) || string.IsNullOrWhiteSpace(email) ||
            string.IsNullOrWhiteSpace(password) || string.IsNullOrWhiteSpace(name))
            return Results.Redirect("/cadastro?error=" + Uri.EscapeDataString("Preencha todos os campos."));

        var normalizedEmail = email.Trim().ToLowerInvariant();
        if (await userManager.FindByEmailAsync(normalizedEmail) is not null)
            return Results.Redirect("/cadastro?error=" + Uri.EscapeDataString("Email já cadastrado."));

        var org = new Organization { Name = orgName.Trim() };
        db.Organizations.Add(org);
        await db.SaveChangesAsync();

        var user = new ApplicationUser
        {
            UserName = normalizedEmail,
            Email = normalizedEmail,
            EmailConfirmed = true,
            Name = name.Trim(),
            Role = UserRole.ADMIN,
            OrganizationId = org.Id
        };
        var create = await userManager.CreateAsync(user, password);
        if (!create.Succeeded)
        {
            var msg = string.Join("; ", create.Errors.Select(e => e.Description));
            return Results.Redirect("/cadastro?error=" + Uri.EscapeDataString(msg));
        }

        await SignInWithClaimsAsync(signIn, user);
        return Results.Redirect("/instalacoes");
    }

    private static async Task<IResult> LogoutAsync(SignInManager<ApplicationUser> signIn)
    {
        await signIn.SignOutAsync();
        return Results.Redirect("/login");
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
}
