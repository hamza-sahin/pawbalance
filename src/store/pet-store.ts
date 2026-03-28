import { create } from "zustand";
import type { Pet } from "@/lib/types";

interface PetState {
  pets: Pet[];
  selectedPetId: string | null;
  isLoading: boolean;
  setPets: (pets: Pet[]) => void;
  addPet: (pet: Pet) => void;
  updatePet: (id: string, updated: Pet) => void;
  removePet: (id: string) => void;
  setSelectedPetId: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
}

export const usePetStore = create<PetState>((set, get) => ({
  pets: [],
  selectedPetId:
    typeof window !== "undefined"
      ? localStorage.getItem("selected_pet_id")
      : null,
  isLoading: true,

  setPets: (pets) => {
    const state = get();
    // Auto-select first pet if none selected
    const selectedId =
      state.selectedPetId && pets.some((p) => p.id === state.selectedPetId)
        ? state.selectedPetId
        : pets[0]?.id ?? null;
    set({ pets, selectedPetId: selectedId, isLoading: false });
    if (selectedId) localStorage.setItem("selected_pet_id", selectedId);
  },

  addPet: (pet) =>
    set((s) => {
      const pets = [...s.pets, pet];
      const selectedPetId = s.selectedPetId ?? pet.id;
      localStorage.setItem("selected_pet_id", selectedPetId);
      return { pets, selectedPetId };
    }),

  updatePet: (id, updated) =>
    set((s) => ({ pets: s.pets.map((p) => (p.id === id ? updated : p)) })),

  removePet: (id) =>
    set((s) => {
      const pets = s.pets.filter((p) => p.id !== id);
      const selectedPetId =
        s.selectedPetId === id ? (pets[0]?.id ?? null) : s.selectedPetId;
      if (selectedPetId) localStorage.setItem("selected_pet_id", selectedPetId);
      else localStorage.removeItem("selected_pet_id");
      return { pets, selectedPetId };
    }),

  setSelectedPetId: (id) => {
    if (id) localStorage.setItem("selected_pet_id", id);
    else localStorage.removeItem("selected_pet_id");
    set({ selectedPetId: id });
  },

  setLoading: (isLoading) => set({ isLoading }),
}));
