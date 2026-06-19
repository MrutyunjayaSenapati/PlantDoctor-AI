import { create } from "zustand";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  login: (user, token) => {
    console.log("Auth: login", user.email);
    set({ user, token, isAuthenticated: true, isLoading: false });
  },
  logout: () => {
    console.log("Auth: logout");
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },
  setLoading: (loading) => set({ isLoading: loading }),
}));
