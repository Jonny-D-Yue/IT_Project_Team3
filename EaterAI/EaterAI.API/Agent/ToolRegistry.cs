using OpenAI.Chat;

namespace EaterAI.API.Agent;

public class ToolRegistry
{
    private readonly List<ChatTool> _tools;

    public ToolRegistry()
    {
        _tools = new List<ChatTool>
        {
            ChatTool.CreateFunctionTool(
                "fetch_menu",
                "Fetch all menu items for a given restaurant.",
                BinaryData.FromString("""
                {
                  "type": "object",
                  "properties": {
                    "restaurant_id": {
                      "type": "string",
                      "description": "The ID of the restaurant to fetch the menu for."
                    }
                  },
                  "required": ["restaurant_id"]
                }
                """)),

            ChatTool.CreateFunctionTool(
                "filter_menu",
                "Filter menu items across all restaurants or within a specific restaurant based on dietary criteria.",
                BinaryData.FromString("""
                {
                  "type": "object",
                  "properties": {
                    "restaurant_id": {
                      "type": "string",
                      "description": "Optional restaurant ID to narrow search."
                    },
                    "is_vegan": {
                      "type": "boolean",
                      "description": "Filter for vegan dishes."
                    },
                    "is_spicy": {
                      "type": "boolean",
                      "description": "Filter for spicy dishes."
                    },
                    "max_calories": {
                      "type": "integer",
                      "description": "Maximum calorie count."
                    },
                    "min_protein": {
                      "type": "number",
                      "description": "Minimum protein in grams."
                    },
                    "max_price": {
                      "type": "number",
                      "description": "Maximum price."
                    },
                    "exclude_allergens": {
                      "type": "array",
                      "items": { "type": "string" },
                      "description": "List of allergens to exclude."
                    },
                    "tags": {
                      "type": "array",
                      "items": { "type": "string" },
                      "description": "Tags the dish must have (any match)."
                    },
                    "course": {
                      "type": "string",
                      "enum": ["appetizer", "snack", "main", "dessert"],
                      "description": "Filter by meal course type. appetizer=前菜, snack=小吃, main=主菜, dessert=甜品."
                    }
                  },
                  "required": []
                }
                """)),

            ChatTool.CreateFunctionTool(
                "rank_dishes",
                "Rank a list of dishes by a specified goal criterion.",
                BinaryData.FromString("""
                {
                  "type": "object",
                  "properties": {
                    "dish_ids": {
                      "type": "array",
                      "items": { "type": "string" },
                      "description": "List of menu item IDs to rank."
                    },
                    "goal": {
                      "type": "string",
                      "enum": ["calories_low", "protein_high", "price_low", "popularity_high"],
                      "description": "The ranking criterion."
                    }
                  },
                  "required": ["dish_ids", "goal"]
                }
                """)),

            ChatTool.CreateFunctionTool(
                "build_combo",
                "Build an optimised meal combination within a budget for a given health goal.",
                BinaryData.FromString("""
                {
                  "type": "object",
                  "properties": {
                    "restaurant_id": {
                      "type": "string",
                      "description": "The restaurant to source dishes from."
                    },
                    "budget": {
                      "type": "number",
                      "description": "Maximum total price for the combo."
                    },
                    "goal": {
                      "type": "string",
                      "enum": ["weight_loss", "muscle_gain", "balanced"],
                      "description": "The health goal driving the selection."
                    }
                  },
                  "required": ["restaurant_id", "budget", "goal"]
                }
                """)),

            ChatTool.CreateFunctionTool(
                "get_user_stats",
                "Retrieve the weekly meal statistics for a user.",
                BinaryData.FromString("""
                {
                  "type": "object",
                  "properties": {
                    "user_id": {
                      "type": "string",
                      "description": "The ID of the user."
                    }
                  },
                  "required": ["user_id"]
                }
                """)),

            ChatTool.CreateFunctionTool(
                "log_meal",
                "Log a meal dish for a user.",
                BinaryData.FromString("""
                {
                  "type": "object",
                  "properties": {
                    "user_id": {
                      "type": "string",
                      "description": "The ID of the user logging the meal."
                    },
                    "dish_id": {
                      "type": "string",
                      "description": "The menu item ID of the dish to log."
                    }
                  },
                  "required": ["user_id", "dish_id"]
                }
                """))
        };
    }

    public IReadOnlyList<ChatTool> GetAllTools() => _tools.AsReadOnly();
}
