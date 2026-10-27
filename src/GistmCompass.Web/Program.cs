using GistmCompass.Application.Abstractions;
using GistmCompass.Infrastructure;
using GistmCompass.Infrastructure.Seed;
using GistmCompass.Web;
using GistmCompass.Web.Components;
using GistmCompass.Web.Services;
using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRazorComponents()
    .AddInteractiveServerComponents();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserAccessor, CascadingCurrentUserAccessor>();
builder.Services.AddCascadingAuthenticationState();
builder.Services.AddAuthorization();
builder.Services.AddGistmInfrastructure(builder.Configuration);

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "GistmCompass.Auth";
    options.LoginPath = "/login";
    options.AccessDeniedPath = "/login";
});

// Entra ID SSO — conditional on AzureAd:ClientId
var azureAd = builder.Configuration.GetSection("AzureAd");
if (!string.IsNullOrWhiteSpace(azureAd["ClientId"]))
{
    builder.Services.AddAuthentication()
        .AddOpenIdConnect("EntraId", options =>
        {
            options.Authority = $"{azureAd["Instance"]}{azureAd["TenantId"]}/v2.0";
            options.ClientId = azureAd["ClientId"];
            options.ClientSecret = azureAd["ClientSecret"];
            options.CallbackPath = azureAd["CallbackPath"] ?? "/signin-oidc";
            options.ResponseType = "code";
            options.SaveTokens = true;
        });
}

var app = builder.Build();

Directory.CreateDirectory(Path.Combine(app.Environment.ContentRootPath, "App_Data"));
await GistmContentSeeder.SeedAsync(app.Services);

if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();
app.UseAntiforgery();
app.UseAuthentication();
app.UseAuthorization();

app.MapAccountEndpoints();

app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();

app.Run();
