import { Type, type Static } from "@sinclair/typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import { createClient } from "@supabase/supabase-js";

const LookupFoodParams = Type.Object({
  query: Type.String({ description: "The ingredient name to look up in the food safety database" }),
});

type LookupFoodParams = Static<typeof LookupFoodParams>;

interface FoodRow {
  id: string;
  name_tr: string;
  category_tr: string;
  safety_level: string;
  dangerous_parts: string | null;
  preparation: string | null;
  benefits: string | null;
  warnings: string | null;
}

export function createLookupFoodTool(
  supabaseUrl: string,
  supabaseKey: string,
): AgentTool<typeof LookupFoodParams, FoodRow | null> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  return {
    name: "lookup_food",
    label: "Lookup Food",
    description:
      "Search the dog food safety database for an ingredient. Returns safety level, dangerous parts, preparation requirements, benefits, and warnings. Use this for every ingredient in the recipe.",
    parameters: LookupFoodParams,
    execute: async (toolCallId, { query }) => {
      const { data, error } = await supabase.rpc("search_foods", {
        search_query: query,
      });

      if (error || !data || data.length === 0) {
        return {
          content: [
            {
              type: "text",
              text: `No match found in the food safety database for "${query}". Use your own knowledge to assess this ingredient.`,
            },
          ],
          details: null,
        };
      }

      const food = data[0] as FoodRow;
      const summary = [
        `Food: ${food.name_tr}`,
        `Category: ${food.category_tr}`,
        `Safety: ${food.safety_level}`,
        food.dangerous_parts
          ? `Dangerous parts: ${food.dangerous_parts}`
          : null,
        food.preparation ? `Preparation: ${food.preparation}` : null,
        food.benefits ? `Benefits: ${food.benefits}` : null,
        food.warnings ? `Warnings: ${food.warnings}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      return {
        content: [{ type: "text", text: summary }],
        details: food,
      };
    },
  };
}
