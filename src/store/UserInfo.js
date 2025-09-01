import { create } from "zustand";

export const useUserStore = create((set, get) => ({
    user: {},
    setUser: (data) => set({ user: data })
}))
