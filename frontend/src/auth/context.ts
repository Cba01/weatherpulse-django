import { createContext } from "react";

import type { User } from "../api/types";

export type AuthStatus = "loading" | "authenticated" | "anonymous";

export type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const AuthContext = createContext<AuthContextValue | null>(null);
