import { api } from "./client";
import type { Tokens, User } from "./types";

export async function login(username: string, password: string): Promise<Tokens> {
  const { data } = await api.post<Tokens>("/auth/token/", { username, password });
  return data;
}

export async function register(username: string, email: string, password: string): Promise<User> {
  const { data } = await api.post<User>("/auth/register/", { username, email, password });
  return data;
}

export async function logout(refresh: string): Promise<void> {
  await api.post("/auth/logout/", { refresh });
}

export async function fetchMe(): Promise<User> {
  const { data } = await api.get<User>("/auth/me/");
  return data;
}
