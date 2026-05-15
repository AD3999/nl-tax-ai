import { client } from "./client";

export interface LoginPayload { username: string; password: string; }
export interface RegisterPayload { email: string; username: string; password: string; user_type: string; preferred_language: string; }
export interface TokenPair { access: string; refresh: string; }

export const login = async (payload: LoginPayload): Promise<TokenPair> => {
  const { data } = await client.post<TokenPair>("/auth/token/", payload);
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
  return data;
};

export const register = async (payload: RegisterPayload) => {
  const { data } = await client.post("/users/register/", payload);
  return data;
};

export const logout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
};
