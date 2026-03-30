"use client";

import { useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import { usePetStore } from "@/store/pet-store";
import { useAuthStore } from "@/store/auth-store";
import type { Pet } from "@/lib/types";
import type { PetFormValues } from "@/lib/validators";
import { MAX_PETS } from "@/lib/constants";

export function usePets() {
  const {
    pets,
    selectedPetId,
    isLoading,
    setPets,
    addPet,
    updatePet,
    removePet,
    setSelectedPetId,
    setLoading,
    loadGuestPet,
    saveGuestPet,
    clearGuestPet,
    getGuestPetData,
  } = usePetStore();

  const selectedPet = pets.find((p) => p.id === selectedPetId) ?? null;
  const canAddMore = pets.length < MAX_PETS;

  const fetchPets = useCallback(async () => {
    const user = useAuthStore.getState().user;
    if (!user) return;
    setLoading(true);
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("pets")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    setPets((data as Pet[]) ?? []);
  }, [setPets, setLoading]);

  const createPet = useCallback(
    async (values: PetFormValues, photoDataUrl?: string | null) => {
      const user = useAuthStore.getState().user;
      if (!user) throw new Error("Not authenticated");
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from("pets")
        .insert({
          owner_id: user.id,
          name: values.name,
          breed: values.breed,
          age_months: values.age_months,
          weight_kg: values.weight_kg,
          gender: values.gender,
          is_neutered: values.is_neutered,
          body_condition_score: values.body_condition_score,
          activity_level: values.activity_level,
          known_allergies: null,
        })
        .select()
        .single();
      if (error) throw error;

      let pet = data as Pet;

      // Upload photo if provided
      if (photoDataUrl) {
        pet = await uploadPetPhoto(pet.id, photoDataUrl);
      }

      addPet(pet);
      return pet;
    },
    [addPet],
  );

  const editPet = useCallback(
    async (
      petId: string,
      values: PetFormValues,
      photoDataUrl?: string | null,
      removePhoto?: boolean,
    ) => {
      const supabase = getSupabase();

      if (removePhoto) {
        const user = useAuthStore.getState().user;
        if (user) {
          await supabase.storage.from("pet-photos").remove([`${user.id}/${petId}`]);
        }
      }

      const { data, error } = await supabase
        .from("pets")
        .update({
          name: values.name,
          breed: values.breed,
          age_months: values.age_months,
          weight_kg: values.weight_kg,
          gender: values.gender,
          is_neutered: values.is_neutered,
          body_condition_score: values.body_condition_score,
          activity_level: values.activity_level,
          ...(removePhoto ? { avatar_url: null } : {}),
        })
        .eq("id", petId)
        .select()
        .single();
      if (error) throw error;

      let pet = data as Pet;

      if (photoDataUrl && !removePhoto) {
        pet = await uploadPetPhoto(petId, photoDataUrl);
      }

      updatePet(petId, pet);
      return pet;
    },
    [updatePet],
  );

  const deletePet = useCallback(
    async (petId: string) => {
      const supabase = getSupabase();
      const user = useAuthStore.getState().user;

      // Remove photo from storage
      if (user) {
        await supabase.storage.from("pet-photos").remove([`${user.id}/${petId}`]);
      }

      const { error } = await supabase.from("pets").delete().eq("id", petId);
      if (error) throw error;
      removePet(petId);
    },
    [removePet],
  );

  const syncGuestPet = useCallback(async () => {
    const guestData = getGuestPetData();
    if (!guestData) return;

    const user = useAuthStore.getState().user;
    if (!user) return;

    try {
      await createPet(guestData.values, guestData.photo);
      clearGuestPet();
    } catch {
      // Keep guest pet in localStorage — will retry on next app launch
    }
  }, [createPet, getGuestPetData, clearGuestPet]);

  return {
    pets,
    selectedPet,
    selectedPetId,
    isLoading,
    canAddMore,
    fetchPets,
    createPet,
    editPet,
    deletePet,
    setSelectedPetId,
    loadGuestPet,
    saveGuestPet,
    syncGuestPet,
  };
}

/** Helper: upload a data-URL photo to Supabase storage and update the pet row */
async function uploadPetPhoto(petId: string, dataUrl: string): Promise<Pet> {
  const user = useAuthStore.getState().user;
  if (!user) throw new Error("Not authenticated");
  const supabase = getSupabase();

  // Convert data URL to Blob
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const ext = blob.type.split("/")[1] ?? "jpg";
  const path = `${user.id}/${petId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("pet-photos")
    .upload(path, blob, { upsert: true });
  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from("pet-photos").getPublicUrl(path);

  // Update pet row with avatar URL
  const { data, error } = await supabase
    .from("pets")
    .update({ avatar_url: publicUrl })
    .eq("id", petId)
    .select()
    .single();
  if (error) throw error;
  return data as Pet;
}
