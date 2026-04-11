import { Agent } from "@mariozechner/pi-agent-core";
import { streamSimple } from "@mariozechner/pi-ai";
import { AuthStorage, ModelRegistry } from "@mariozechner/pi-coding-agent";
import { readFileSync } from "fs";
import { join } from "path";
import { createLookupFoodTool } from "./tools/lookup-food";
import { createGetPetProfileTool } from "./tools/get-pet-profile";
import { createSearchKnowledgeTool } from "./tools/search-knowledge";
import { buildSystemPrompt } from "./system-prompt";

interface CreateRecipeAgentOptions {
  locale: string;
  supabaseUrl: string;
  supabaseKey: string;
}

// Singleton auth — initialized once, reused across requests
let authStorage: AuthStorage | null = null;
let modelRegistry: ModelRegistry | null = null;

function getAuth() {
  if (!authStorage) {
    // Read OAuth credentials from auth.json and seed into in-memory backend.
    // This allows token refresh without filesystem writes (works in read-only Docker).
    const authPath = join(process.cwd(), "auth.json");
    const data = JSON.parse(readFileSync(authPath, "utf-8"));
    authStorage = AuthStorage.inMemory(data);
    modelRegistry = ModelRegistry.create(authStorage);
  }
  return { authStorage, modelRegistry: modelRegistry! };
}

export function createRecipeAgent({
  locale,
  supabaseUrl,
  supabaseKey,
}: CreateRecipeAgentOptions): Agent {
  const { authStorage: auth, modelRegistry: registry } = getAuth();

  const model = registry.find("anthropic", "claude-sonnet-4-20250514");
  if (!model) {
    throw new Error("Claude model not available — check auth.json OAuth credentials");
  }

  const lookupFood = createLookupFoodTool(supabaseUrl, supabaseKey);
  const getPetProfile = createGetPetProfileTool(supabaseUrl, supabaseKey);
  const searchKnowledge = createSearchKnowledgeTool();

  return new Agent({
    initialState: {
      systemPrompt: buildSystemPrompt(locale),
      model,
      tools: [lookupFood, getPetProfile, searchKnowledge],
    },
    streamFn: async (streamModel, context, options) => {
      const apiKey = await auth.getApiKey(streamModel.provider);
      if (!apiKey) {
        throw new Error(
          `No valid credentials for provider "${streamModel.provider}". ` +
          `OAuth token may have expired. Run: node scripts/refresh-auth.mjs`
        );
      }
      return streamSimple(streamModel, context, { ...options, apiKey });
    },
    toolExecution: "parallel",
  });
}
