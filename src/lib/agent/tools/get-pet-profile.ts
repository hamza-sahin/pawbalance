import { Type, type Static } from "@sinclair/typebox";
import type { AgentTool } from "@mariozechner/pi-agent-core";
import { createClient } from "@supabase/supabase-js";
import { formatPetProfileSummary } from "@/lib/pet-profile-summary";
import type { Pet } from "@/lib/types";

const GetPetProfileParams = Type.Object({
  pet_id: Type.String({ description: "The UUID of the pet to fetch" }),
});

type GetPetProfileParams = Static<typeof GetPetProfileParams>;

type PetProfile = Pick<
  Pet,
  | "id"
  | "name"
  | "breed"
  | "age_months"
  | "birth_date"
  | "weight_kg"
  | "gender"
  | "is_neutered"
  | "body_condition_score"
  | "activity_level"
  | "expected_adult_weight_kg"
  | "reproductive_state"
  | "gestation_week"
  | "lactation_week"
  | "litter_size"
>;

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
          "id, name, breed, age_months, birth_date, weight_kg, gender, is_neutered, body_condition_score, activity_level, expected_adult_weight_kg, reproductive_state, gestation_week, lactation_week, litter_size",
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
      const summary = formatPetProfileSummary(pet);

      return {
        content: [{ type: "text", text: summary }],
        details: pet,
      };
    },
  };
}
