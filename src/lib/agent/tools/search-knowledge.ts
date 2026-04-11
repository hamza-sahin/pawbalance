import { Type, type Static } from "@sinclair/typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import { embedQuery, searchVideoChunks } from "@/lib/embeddings";

const SearchKnowledgeParams = Type.Object({
  query: Type.String({
    description:
      "An English search query describing what veterinary nutrition knowledge you need. " +
      "Always use English regardless of the user's language. " +
      "Examples: 'sweet potato benefits and risks for dogs', 'raw chicken bones safety', 'turmeric golden paste dosing for dogs'",
  }),
});

type SearchKnowledgeParams = Static<typeof SearchKnowledgeParams>;

export function createSearchKnowledgeTool(): AgentTool<
  typeof SearchKnowledgeParams,
  null
> {
  return {
    name: "search_knowledge_base",
    label: "Search Knowledge Base",
    description:
      "Search a veterinary nutrition knowledge base for expert advice on dog food ingredients, preparation methods, supplements, and dietary guidance. " +
      "Use this AFTER looking up ingredients in the safety database to get deeper nutritional insights. " +
      "Always query in English.",
    parameters: SearchKnowledgeParams,
    execute: async (toolCallId, { query }) => {
      try {
        const embedding = await embedQuery(query);
        const chunks = await searchVideoChunks(embedding, 3);

        if (chunks.length === 0) {
          return {
            content: [
              {
                type: "text",
                text: `No relevant knowledge found for "${query}".`,
              },
            ],
            details: null,
          };
        }

        const summary = chunks
          .map(
            (c, i) =>
              `--- Excerpt ${i + 1} (from: ${c.video_title}) ---\n${c.content}`,
          )
          .join("\n\n");

        console.log(`RAG tool: retrieved ${chunks.length} chunks for query: "${query}"`);

        return {
          content: [{ type: "text", text: summary }],
          details: null,
        };
      } catch (err) {
        console.error("search_knowledge_base error:", err);
        return {
          content: [
            {
              type: "text",
              text: `Knowledge base search failed. Use your own knowledge to assess.`,
            },
          ],
          details: null,
        };
      }
    },
  };
}
