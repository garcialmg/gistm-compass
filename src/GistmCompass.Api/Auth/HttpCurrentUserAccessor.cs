using System.Security.Claims;
using GistmCompass.Application.Abstractions;
using GistmCompass.Domain.Enums;

namespace GistmCompass.Api.Auth;

public class HttpCurrentUserAccessor : ICurrentUserAccessor
{
    private readonly IHttpContextAccessor _http;

    public HttpCurrentUserAccessor(IHttpContextAccessor http) => _http = http;

    public CurrentUser? User
    {
        get
        {
            var principal = _http.HttpContext?.User;
            if (principal?.Identity?.IsAuthenticated != true) return null;
            var id = principal.FindFirstValue(ClaimTypes.NameIdentifier);
            var email = principal.FindFirstValue(ClaimTypes.Email) ?? principal.Identity.Name ?? "";
            var name = principal.FindFirstValue("name") ?? principal.FindFirstValue(ClaimTypes.Name) ?? email;
            var org = principal.FindFirstValue("organizationId");
            var roleStr = principal.FindFirstValue("orgRole") ?? principal.FindFirstValue(ClaimTypes.Role) ?? "MEMBER";
            if (id is null || org is null) return null;
            Enum.TryParse<UserRole>(roleStr, true, out var role);
            return new CurrentUser(id, email, name, org, role);
        }
    }
}
