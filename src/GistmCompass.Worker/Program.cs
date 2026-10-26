using GistmCompass.Application.Abstractions;
using GistmCompass.Infrastructure;
using GistmCompass.Infrastructure.Seed;
using GistmCompass.Worker;

var builder = Host.CreateApplicationBuilder(args);

builder.Services.AddSingleton<ICurrentUserAccessor, WorkerCurrentUserAccessor>();
builder.Services.AddGistmInfrastructure(builder.Configuration);
builder.Services.AddSingleton<JobProcessor>();
builder.Services.AddHostedService<JobQueueHostedService>();

var host = builder.Build();

Directory.CreateDirectory(Path.Combine(AppContext.BaseDirectory, "App_Data"));
await GistmContentSeeder.SeedAsync(host.Services);

await host.RunAsync();
