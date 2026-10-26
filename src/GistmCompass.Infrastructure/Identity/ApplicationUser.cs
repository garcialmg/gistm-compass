using GistmCompass.Domain.Enums;
using Microsoft.AspNetCore.Identity;

namespace GistmCompass.Infrastructure.Identity;

public class ApplicationUser : IdentityUser
{
    public string Name { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.MEMBER;
    public string OrganizationId { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
