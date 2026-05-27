import { client } from "./client";

export interface LoginPayload { username: string; password: string; }
export interface RegisterPayload { email: string; username: string; password: string; user_type: string; preferred_language: string; }
export interface TokenPair { access: string; refresh: string; }

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  user_type: string;
  preferred_language: string;
  tax_year: number;
  plan: "free" | "premium";
  daily_message_count: number;
  daily_message_date: string | null;
  is_admin?: boolean;
}

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

export const fetchProfile = async (): Promise<AuthUser | null> => {
  if (!localStorage.getItem("access_token")) return null;
  try {
    const { data } = await client.get<AuthUser>("/users/profile/");
    return data;
  } catch {
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  // Clear profile and anon chat history so the next visitor (or anonymous user)
  // never sees a previous user's data. The user-specific history key
  // (taxwijs_chat_history_u{id}) is intentionally kept so it can be restored
  // on the next login.
  localStorage.removeItem("taxwijs_calc_input");
  localStorage.removeItem("taxwijs_chat_history");
  localStorage.removeItem("taxwijs_user_id");
};
