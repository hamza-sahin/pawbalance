import { create } from "zustand";
import type { Pet } from "@/lib/types";
import type { PetFormValues } from "@/lib/validators";
import { buildLocalPet } from "@/lib/pet-payload";

const GUEST_PET_KEY = "guest_pet";
const ONBOARDING_KEY = "onboarding_completed";

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
  loadGuestPet: () => void;
  saveGuestPet: (values: PetFormValues, photoDataUrl?: string | null) => void;
  clearGuestPet: () => void;
  getGuestPetData: () => { values: PetFormValues; photo?: string | null } | null;
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

  loadGuestPet: () => {
    try {
      const raw = localStorage.getItem(GUEST_PET_KEY);
      if (!raw) {
        set({ isLoading: false });
        return;
      }
      const { values, photo } = JSON.parse(raw) as { values: PetFormValues; photo?: string | null };
      const pet = buildLocalPet(values, photo);
      set({ pets: [pet], selectedPetId: pet.id, isLoading: false });
      localStorage.setItem("selected_pet_id", pet.id);
    } catch {
      set({ isLoading: false });
    }
  },

  saveGuestPet: (values, photoDataUrl) => {
    const payload = { values, photo: photoDataUrl ?? null };
    localStorage.setItem(GUEST_PET_KEY, JSON.stringify(payload));
    localStorage.setItem(ONBOARDING_KEY, "true");
    const pet = buildLocalPet(values, photoDataUrl);
    set({ pets: [pet], selectedPetId: pet.id, isLoading: false });
    localStorage.setItem("selected_pet_id", pet.id);
  },

  clearGuestPet: () => {
    localStorage.removeItem(GUEST_PET_KEY);
  },

  getGuestPetData: () => {
    try {
      const raw = localStorage.getItem(GUEST_PET_KEY);
      if (!raw) return null;
      return JSON.parse(raw) as { values: PetFormValues; photo?: string | null };
    } catch {
      return null;
    }
  },
}));
