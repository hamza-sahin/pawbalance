import { createClient } from "@supabase/supabase-js";
import { createRecipeAgent } from "@/lib/agent/create-agent";
import type { RecipeIngredient, AnalysisResult } from "@/lib/types";

export async function POST(request: Request) {
  // 1. Parse request
  const { recipeId, petId, locale } = await request.json();
  if (!recipeId) {
    return Response.json({ error: "recipeId is required" }, { status: 400 });
  }

  // 2. Validate auth
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  const supabase = createClient(supabaseUrl, supabaseKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // 3. Verify user owns the recipe
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .select("*, recipe_ingredients(*)")
    .eq("id", recipeId)
    .single();

  if (recipeError || !recipe) {
    return Response.json({ error: "Recipe not found" }, { status: 404 });
  }

  const ingredients = (recipe.recipe_ingredients as RecipeIngredient[]).sort(
    (a, b) => a.sort_order - b.sort_order,
  );

  // 4. Create pending analysis record
  const { data: analysis, error: analysisError } = await supabase
    .from("recipe_analyses")
    .insert({
      recipe_id: recipeId,
      pet_id: petId || null,
      status: "pending",
    })
    .select()
    .single();

  if (analysisError) {
    return Response.json({ error: "Failed to create analysis" }, { status: 500 });
  }

  // 5. Build user message with recipe data
  const ingredientList = ingredients
    .map((i, idx) => `${idx + 1}. ${i.name} — Preparation: ${i.preparation} (ingredient_id: ${i.id})`)
    .join("\n");

  const userMessage = `Analyze this dog food recipe:

Recipe: "${recipe.name}"
${petId ? `Pet ID: ${petId}` : "No specific pet selected."}

Ingredients:
${ingredientList}

Look up each ingredient in the safety database and provide your analysis.`;

  // 6. Create agent and stream response
  const agent = createRecipeAgent({
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
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
        );
      };

      // Send ingredient list for progress tracking
      send("ingredients", ingredients.map((i) => ({ id: i.id, name: i.name })));

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

        // Extract the final assistant message text
        const messages = agent.state.messages;
        const lastAssistant = [...messages]
          .reverse()
          .find((m) => m.role === "assistant");

        let resultJson: AnalysisResult | null = null;
        if (lastAssistant && "content" in lastAssistant) {
          const textContent = (lastAssistant.content as any[]).find(
            (c: any) => c.type === "text",
          );
          if (textContent) {
            try {
              // Strip markdown code fences if present
              let text = textContent.text.trim();
              if (text.startsWith("```")) {
                text = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "");
              }
              resultJson = JSON.parse(text);
            } catch {
              // Model didn't return valid JSON
            }
          }
        }

        if (resultJson) {
          // Save completed analysis
          await supabase
            .from("recipe_analyses")
            .update({
              status: "completed",
              result: resultJson,
              model_used: "claude-sonnet-4-20250514",
            })
            .eq("id", analysis.id);

          send("result", resultJson);
        } else {
          await supabase
            .from("recipe_analyses")
            .update({ status: "failed" })
            .eq("id", analysis.id);

          send("error", { message: "Agent did not return valid JSON" });
        }
      } catch (err) {
        await supabase
          .from("recipe_analyses")
          .update({ status: "failed" })
          .eq("id", analysis.id);

        send("error", {
          message: err instanceof Error ? err.message : "Analysis failed",
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
