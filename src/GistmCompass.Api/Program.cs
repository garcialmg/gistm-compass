using GistmCompass.Api.Auth;
using GistmCompass.Api.Endpoints;
using GistmCompass.Application.Abstractions;
using GistmCompass.Infrastructure;
using GistmCompass.Infrastructure.Seed;
using Microsoft.AspNetCore.Identity;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUserAccessor, HttpCurrentUserAccessor>();
builder.Services.AddGistmInfrastructure(builder.Configuration);
builder.Services.AddAuthorization();
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Cookie.Name = "GistmCompass.Auth";
    options.LoginPath = "/login";
    options.Events.OnRedirectToLogin = ctx =>
    {
        if (ctx.Request.Path.StartsWithSegments("/api"))
        {
            ctx.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        }
        ctx.Response.Redirect(ctx.RedirectUri);
        return Task.CompletedTask;
    };
    options.Events.OnRedirectToAccessDenied = ctx =>
    {
        if (ctx.Request.Path.StartsWithSegments("/api"))
        {
            ctx.Response.StatusCode = StatusCodes.Status403Forbidden;
            return Task.CompletedTask;
        }
        ctx.Response.Redirect(ctx.RedirectUri);
        return Task.CompletedTask;
    };
});

// Entra ID SSO — enable when AzureAd section is present
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

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.ConfigureHttpJsonOptions(o =>
{
    o.SerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
});
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p.AllowAnyHeader().AllowAnyMethod().AllowCredentials()
    .SetIsOriginAllowed(_ => true)));

var app = builder.Build();

Directory.CreateDirectory(Path.Combine(app.Environment.ContentRootPath, "App_Data"));

await GistmContentSeeder.SeedAsync(app.Services);

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapGistmEndpoints();

app.Run();

public partial class Program { }
