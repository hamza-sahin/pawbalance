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

interface AgentSettings {
  defaultProvider?: string;
  defaultModel?: string;
}

// Singleton auth — initialized once, reused across requests
let authStorage: AuthStorage | null = null;
let modelRegistry: ModelRegistry | null = null;
let settings: AgentSettings = {};

function getAuth() {
  if (!authStorage) {
    const agentDir = join(process.cwd(), ".pi", "agent");
    authStorage = AuthStorage.create(join(agentDir, "auth.json"));
    modelRegistry = ModelRegistry.create(authStorage);
    settings = JSON.parse(readFileSync(join(agentDir, "settings.json"), "utf-8"));
  }
  return { authStorage, modelRegistry: modelRegistry!, settings };
}

export function createRecipeAgent({
  locale,
  supabaseUrl,
  supabaseKey,
}: CreateRecipeAgentOptions): Agent {
  const { authStorage: auth, modelRegistry: registry, settings: s } = getAuth();

  const provider = s.defaultProvider ?? "github-copilot";
  const modelId = s.defaultModel ?? "claude-sonnet-4-20250514";
  const model = registry.find(provider, modelId);
  if (!model) {
    throw new Error(`Model ${provider}/${modelId} not available — check .pi/agent/settings.json and auth.json`);
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
      console.log("[agent] streamFn provider:", streamModel.provider, "model:", streamModel.id, "baseUrl:", streamModel.baseUrl);
      const apiKey = await auth.getApiKey(streamModel.provider);
      console.log("[agent] apiKey:", apiKey ? `${apiKey.slice(0, 15)}...` : "NULL");
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
