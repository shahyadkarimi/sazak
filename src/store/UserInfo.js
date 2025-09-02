import { create } from "zustand";

export const useUserStore = create((set, get) => ({
  user: {},
  loading: {},

  setUser: (data) => set({ user: data }),
  setLoading: (loading) => set({ loading }),
}));
