import { Agent } from "@mariozechner/pi-agent-core";
import { getModel, streamSimple } from "@mariozechner/pi-ai";
import { createLookupFoodTool } from "./tools/lookup-food";
import { createGetPetProfileTool } from "./tools/get-pet-profile";
import { buildSystemPrompt } from "./system-prompt";

interface CreateRecipeAgentOptions {
  locale: string;
  supabaseUrl: string;
  supabaseKey: string;
  anthropicApiKey: string;
}

export function createRecipeAgent({
  locale,
  supabaseUrl,
  supabaseKey,
  anthropicApiKey,
}: CreateRecipeAgentOptions): Agent {
  const model = getModel("anthropic", "claude-sonnet-4-20250514");

  const lookupFood = createLookupFoodTool(supabaseUrl, supabaseKey);
  const getPetProfile = createGetPetProfileTool(supabaseUrl, supabaseKey);

  return new Agent({
    initialState: {
      systemPrompt: buildSystemPrompt(locale),
      model,
      tools: [lookupFood, getPetProfile],
    },
    streamFn: streamSimple,
    getApiKey: async (provider) => {
      if (provider === "anthropic") return anthropicApiKey;
      return undefined;
    },
    toolExecution: "parallel",
    afterToolCall: async (context) => {
      // Log for analytics (can be extended later)
      console.log(
        `[agent] Tool ${context.toolCall.name} called with args:`,
        context.args,
        `isError: ${context.isError}`,
      );
      return undefined;
    },
  });
}
