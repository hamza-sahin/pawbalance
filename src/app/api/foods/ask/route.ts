import { createClient } from "@supabase/supabase-js";
import { createRecipeAgent } from "@/lib/agent/create-agent";
import { formatPetProfileSummary } from "@/lib/pet-profile-summary";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: corsHeaders });
}

export async function POST(request: Request) {
  // 1. Parse request
  const { query, locale } = await request.json();
  if (!query || typeof query !== "string") {
    return Response.json(
      { error: "query is required" },
      { status: 400, headers: corsHeaders },
    );
  }

  // 2. Validate auth
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: corsHeaders },
    );
  }
  const token = authHeader.slice(7);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // 3. Check subscription tier
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const tier = user?.user_metadata?.subscription_tier ?? "FREE";
  if (tier !== "BASIC" && tier !== "PREMIUM") {
    return Response.json(
      { error: "subscription_required", required: "basic" },
      { status: 403, headers: corsHeaders },
    );
  }

  // 4. Fetch all user pets for personalization
  const { data: pets } = await supabase
    .from("pets")
    .select(
      "id, name, breed, age_months, birth_date, weight_kg, gender, is_neutered, body_condition_score, activity_level, expected_adult_weight_kg, reproductive_state, gestation_week, lactation_week, litter_size",
    )
    .eq("owner_id", user!.id);

  let petSection = "No pets registered.";
  if (pets && pets.length > 0) {
    const profiles = pets.map((p) => {
      return [`- ${p.name} (ID: ${p.id})`, formatPetProfileSummary(p)].join("\n");
    });
    petSection = `User's dogs:\n${profiles.join("\n")}`;
  }

  // 5. Build user message
  const userMessage = `Assess this food for dogs:

Food: "${query}"

${petSection}

Look up the food in the safety database, research it, and provide your assessment.`;

  // 6. Create agent in food-ask mode
  const agent = createRecipeAgent({
    mode: "food-ask",
    locale: locale || "en",
    supabaseUrl,
    supabaseKey,
  });

  // 7. SSE streaming
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(
            `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`,
          ),
        );
      };

      // Send initial status
      send("status", { phase: "looking_up" });

      // Subscribe to agent events
      agent.subscribe((event) => {
        if (event.type === "tool_execution_start") {
          send("tool_start", {
            toolName: event.toolName,
            args: event.args,
          });
        }
        if (event.type === "tool_execution_end") {
          send("tool_end", {
            toolName: event.toolName,
            isError: event.isError,
            result: event.result,
          });
        }
      });

      try {
        await agent.prompt(userMessage);

        const messages = agent.state.messages;
        const lastAssistant = [...messages]
          .reverse()
          .find((m) => m.role === "assistant");

        let resultJson = null;
        if (lastAssistant && "content" in lastAssistant) {
          const textContent = (lastAssistant.content as any[]).find(
            (c: any) => c.type === "text",
          );
          if (textContent) {
            try {
              let text = textContent.text.trim();
              if (text.startsWith("```")) {
                text = text
                  .replace(/^```(?:json)?\n?/, "")
                  .replace(/\n?```$/, "");
              }
              resultJson = JSON.parse(text);
            } catch {
              // Agent didn't return valid JSON
            }
          }
        }

        if (resultJson) {
          send("result", resultJson);
        } else {
          send("error", { message: "Agent did not return valid JSON" });
        }
      } catch (err) {
        send("error", {
          message:
            err instanceof Error ? err.message : "Analysis failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      ...corsHeaders,
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
