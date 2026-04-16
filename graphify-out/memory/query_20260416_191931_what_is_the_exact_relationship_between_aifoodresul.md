---
type: "query"
date: "2026-04-16T19:19:31.632655+00:00"
question: "What is the exact relationship between AIFoodResult type and AI Food Search Design Spec?"
contributor: "graphify"
source_nodes: ["AIFoodResult type", "AI Food Search Design Spec"]
---

# Q: What is the exact relationship between AIFoodResult type and AI Food Search Design Spec?

## Answer

The graph currently shows a direct but ambiguous conceptual edge between AIFoodResult type and AI Food Search Design Spec. There is no stronger extracted implementation edge yet. AIFoodResult type is concretely connected to useAIFoodLookup hook via a shares_data_with edge, while the design spec is concretely connected to Food ask SSE endpoint, Inline AI suggestion row, AI food detail page reuse, and foods.ai_ask entitlement. This means the likely relationship is that AIFoodResult type implements or carries data for the AI search flow described by the spec, but the graph lacks an explicit extracted bridge from the type definition to the documented architecture.

## Source Nodes

- AIFoodResult type
- AI Food Search Design Spec