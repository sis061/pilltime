import { create } from "zustand";

interface User {
  id: string;
  email?: string;
  // 필요하면 더 추가: nickname, avatar 등
}

interface UserState {
  user: User | null;
  setUser: (user: User | null) => void;
  clearUser: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
