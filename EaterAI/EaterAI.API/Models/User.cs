using EaterAI.Shared.Enums;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EaterAI.API.Models;

public class User
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; } = string.Empty;

    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public EaterAI.Shared.Enums.UserRole Role { get; set; } = EaterAI.Shared.Enums.UserRole.Customer;
    public UserProfile Profile { get; set; } = new();

    [BsonIgnoreIfNull]
    public double[]? VoicePrint { get; set; }

    [BsonIgnore]
    public bool HasVoicePrint => VoicePrint is { Length: > 0 };

    [BsonIgnoreIfNull]
    public List<double[]>? VoiceSamples { get; set; }
}

public class UserProfile
{
    public DietType DietType { get; set; } = DietType.None;
    public List<string> Allergies { get; set; } = new();
    public List<MealGoal> Goals { get; set; } = new();
    public decimal Budget { get; set; }
}
