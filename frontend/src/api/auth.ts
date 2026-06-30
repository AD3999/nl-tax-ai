import { client } from "./client";

export interface LoginPayload { username: string; password: string; }
export interface RegisterPayload {
  email: string;
  username: string;
  password: string;
  user_type: string;
  role?: "client" | "accountant";
  preferred_language: string;
  firm_name?: string;
  kvk_number?: string;
}
export interface TokenPair { access: string; refresh: string; }

export interface AccountantProfileData {
  firm_name: string;
  kvk_number: string;
  designation: string;
  phone: string;
  client_limit: number;
  is_verified: boolean;
}

export interface AuthUser {
  id: number;
  email: string;
  username: string;
  user_type: string;
  role: "client" | "accountant" | "admin";
  preferred_language: string;
  tax_year: number;
  plan: "free" | "premium";
  daily_message_count: number;
  daily_message_date: string | null;
  is_admin?: boolean;
  accountant_profile?: AccountantProfileData | null;
  has_accountant?: boolean;
}

export const login = async (payload: LoginPayload): Promise<TokenPair> => {
  const { data } = await client.post<TokenPair>("/auth/token/", payload);
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
  return data;
};

export interface RegisterResponse extends TokenPair {
  user: AuthUser;
}

export const register = async (payload: RegisterPayload): Promise<RegisterResponse> => {
  const { data } = await client.post<RegisterResponse>("/users/register/", payload);
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
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

export interface GoogleAuthResponse extends TokenPair {
  is_new: boolean;
  user: AuthUser;
}

export const googleAuth = async (accessToken: string, userType = "zzp"): Promise<GoogleAuthResponse> => {
  const { data } = await client.post<GoogleAuthResponse>("/users/auth/google/", {
    access_token: accessToken,
    user_type: userType,
  });
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
  return data;
};

export const googleAuthCode = async (
  code: string,
  codeVerifier: string,
  redirectUri: string,
  userType = "zzp",
): Promise<GoogleAuthResponse> => {
  const { data } = await client.post<GoogleAuthResponse>("/users/auth/google/", {
    code,
    code_verifier: codeVerifier,
    redirect_uri: redirectUri,
    user_type: userType,
  });
  localStorage.setItem("access_token", data.access);
  localStorage.setItem("refresh_token", data.refresh);
  return data;
};

/** All localStorage keys that belong to the authenticated session.
 *  Must be cleared on logout so user A's data never leaks to user B
 *  on a shared device. Add new keys here whenever a new feature writes
 *  user-specific data to localStorage. */
const SESSION_KEYS = [
  "access_token",
  "refresh_token",
  // Profile / calculator
  "taxwijs_calc_input",
  "taxwijs_user_id",
  // Chat history
  "taxwijs_chat_history",
  // IB Guide + Simulation progress
  "taxwijs_ib_guide_progress",
  "taxwijs_simulation_answers",
  "taxwijs_simulation_step",
  // Alert states
  "taxwijs_dismissed_alerts",
  "taxwijs_done_alerts",
  "taxwijs_alert_snoozed_until",
  // Action states
  "taxwijs_action_states",
  "taxwijs_snoozed_until",
] as const;

export const logout = () => {
  SESSION_KEYS.forEach(key => localStorage.removeItem(key));
};

export async function requestAccountantAccess(data: {
  email: string;
  full_name: string;
  firm_name?: string;
  kvk_number?: string;
  designation?: string;
}): Promise<{ detail: string }> {
  const res = await fetch(`${import.meta.env.VITE_API_BASE ?? "/api"}/users/accountant/request-access/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.detail ?? "Request failed");
  return json;
}
