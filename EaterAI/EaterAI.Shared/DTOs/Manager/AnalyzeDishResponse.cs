namespace EaterAI.Shared.DTOs.Manager;
public class AnalyzeDishResponse
{
    public bool   Success     { get; set; }
    public string? Error      { get; set; }
    public string Name        { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public int    Calories    { get; set; }
    public double Protein     { get; set; }
    public double Fat         { get; set; }
    public double Carbs       { get; set; }
    public bool   IsVegan     { get; set; }
    public bool   IsSpicy     { get; set; }
    public string DishType    { get; set; } = string.Empty;
    public string Method      { get; set; } = string.Empty;
    public List<string>        Tags        { get; set; } = new();
    public List<string>        Allergens   { get; set; } = new();
    public List<IngredientDto> Ingredients { get; set; } = new();
}
