using EaterAI.API.Agent;
using EaterAI.API.Configuration;
using EaterAI.API.Data;
using EaterAI.API.Data.Seed;
using EaterAI.API.Middleware;
using EaterAI.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.DataProtection.KeyManagement;
using Microsoft.IdentityModel.Tokens;
using OpenAI;
using System.ClientModel;
using System.Text;

var envFile = Path.Combine(Directory.GetCurrentDirectory(), ".env");
if (File.Exists(envFile))
    {
        foreach (var line in File.ReadAllLines(envFile))
            {
        var trimmed = line.Trim();
                if (string.IsNullOrEmpty(trimmed) || trimmed.StartsWith('#')) continue;
        var idx = trimmed.IndexOf('=');
                if (idx < 0) continue;
        var key = trimmed[..idx].Trim();
        var val = trimmed[(idx + 1)..].Trim();
        Environment.SetEnvironmentVariable(key, val);
            }
    }

var builder = WebApplication.CreateBuilder(args);

// 0. Ensure wwwroot/images directories exist BEFORE app is built so WebRootPath is set
var wwwrootPath = Path.Combine(builder.Environment.ContentRootPath, "wwwroot");
Directory.CreateDirectory(Path.Combine(wwwrootPath, "images", "dishes"));
Directory.CreateDirectory(Path.Combine(wwwrootPath, "images", "restaurants"));

// 1. Bind configuration sections
builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection("MongoDb"));
builder.Services.Configure<JwtSettings>(builder.Configuration.GetSection("Jwt"));
builder.Services.Configure<QwenSettings>(builder.Configuration.GetSection("Qwen"));
builder.Services.Configure<GoogleCloudSettings>(builder.Configuration.GetSection("GoogleCloud"));

// 2. MongoDB context (singleton)
builder.Services.AddSingleton<MongoDbContext>();

// 3. Business services (scoped)
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IMenuService, MenuService>();
builder.Services.AddScoped<IChatService, ChatService>();
builder.Services.AddScoped<IMealLogService, MealLogService>();
builder.Services.AddScoped<IFavoriteService, FavoriteService>();
builder.Services.AddScoped<IVoiceService, VoiceService>();
builder.Services.AddScoped<IImageGenerationService, ImageGenerationService>();
builder.Services.AddScoped<IDishImageService, DishImageService>();
builder.Services.AddScoped<IDishAnalysisService, DishAnalysisService>();
builder.Services.AddScoped<IVoiceLoginService, VoiceLoginService>();
builder.Services.AddHttpClient("SpeechBrain", c =>
    c.BaseAddress = new Uri(builder.Configuration["SpeechBrain:BaseUrl"] ?? "http://localhost:5100"));

// 4. AI Agent infrastructure (scoped)
builder.Services.AddScoped<ToolRegistry>();
builder.Services.AddScoped<ToolDispatcher>();
builder.Services.AddScoped<GoalDetectorService>();
builder.Services.AddScoped<AgentOrchestrator>();

// 5. OpenAI client configured for Qwen endpoint (singleton — thread-safe)
builder.Services.AddSingleton<OpenAIClient>(sp =>
{
    var settings = sp.GetRequiredService<Microsoft.Extensions.Options.IOptions<QwenSettings>>().Value;
    var options = new OpenAIClientOptions { Endpoint = new Uri(settings.BaseUrl) };
    return new OpenAIClient(new ApiKeyCredential(settings.ApiKey), options);
});

// 6. HttpClient for external APIs
builder.Services.AddHttpClient("GoogleCloud");
builder.Services.AddHttpClient("DashScope");

// 7. JWT Authentication
var jwtSettings = builder.Configuration.GetSection("Jwt").Get<JwtSettings>()!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwtSettings.Issuer,
            ValidAudience = jwtSettings.Audience,
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtSettings.SecretKey))
        };
    });

builder.Services.AddAuthorization();

// 8. CORS (open for development)
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

// 9. Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI();

// 10. Seed database on startup
await SeedRunner.RunAsync(app.Services);

// 11. Middleware pipeline
app.UseMiddleware<ExceptionMiddleware>();
app.UseStaticFiles();
app.UseCors();


  


app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

var port = Environment.GetEnvironmentVariable("PORT") ?? "5284";
app.Urls.Add($"http://0.0.0.0:{port}");

app.Run();
