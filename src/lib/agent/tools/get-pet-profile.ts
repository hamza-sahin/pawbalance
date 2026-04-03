import { Type, type Static } from "@sinclair/typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import { createClient } from "@supabase/supabase-js";

const GetPetProfileParams = Type.Object({
  pet_id: Type.String({ description: "The UUID of the pet to fetch" }),
});

type GetPetProfileParams = Static<typeof GetPetProfileParams>;

interface PetProfile {
  id: string;
  name: string;
  breed: string | null;
  age_months: number | null;
  weight_kg: number | null;
  gender: string | null;
  is_neutered: boolean;
  body_condition_score: number | null;
  activity_level: string;
}

export function createGetPetProfileTool(
  supabaseUrl: string,
  supabaseKey: string,
): AgentTool<typeof GetPetProfileParams, PetProfile | null> {
  const supabase = createClient(supabaseUrl, supabaseKey);

  return {
    name: "get_pet_profile",
    label: "Get Pet Profile",
    description:
      "Fetch a dog's profile including breed, weight, age, activity level, and body condition score. Use this to personalize dietary advice.",
    parameters: GetPetProfileParams,
    execute: async (toolCallId, { pet_id }) => {
      const { data, error } = await supabase
        .from("pets")
        .select(
          "id, name, breed, age_months, weight_kg, gender, is_neutered, body_condition_score, activity_level",
        )
        .eq("id", pet_id)
        .single();

      if (error || !data) {
        return {
          content: [
            { type: "text", text: "Could not fetch pet profile. Provide general advice." },
          ],
          details: null,
        };
      }

      const pet = data as PetProfile;
      const ageYears = pet.age_months ? (pet.age_months / 12).toFixed(1) : "unknown";
      const summary = [
        `Dog: ${pet.name}`,
        `Breed: ${pet.breed ?? "unknown"}`,
        `Age: ${ageYears} years (${pet.age_months ?? "?"} months)`,
        `Weight: ${pet.weight_kg ?? "unknown"} kg`,
        `Gender: ${pet.gender ?? "unknown"}, ${pet.is_neutered ? "neutered" : "intact"}`,
        `Body Condition Score: ${pet.body_condition_score ?? "unknown"}/9`,
        `Activity Level: ${pet.activity_level}`,
      ].join("\n");

      return {
        content: [{ type: "text", text: summary }],
        details: pet,
      };
    },
  };
}
