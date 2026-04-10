const apiBaseUrl = () => import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export type UserAddress = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export type UserPublic = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  phone: string;
  address: UserAddress;
};

export type AuthPayload = {
  token: string;
  user: UserPublic;
};

async function parseJson(res: Response): Promise<{ success?: boolean; message?: string; data?: unknown }> {
  return res.json().catch(() => ({}));
}

export async function loginRequest(identifier: string, password: string): Promise<AuthPayload> {
  const res = await fetch(`${apiBaseUrl()}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier: identifier.trim(), password }),
  });
  const json = await parseJson(res);
  if (!res.ok) throw new Error(json.message || "Sign in failed.");
  const data = json.data as AuthPayload | undefined;
  if (!data?.token || !data.user) throw new Error("Invalid response from server.");
  return data;
}

export async function registerRequest(name: string, email: string, password: string): Promise<AuthPayload> {
  const res = await fetch(`${apiBaseUrl()}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: name.trim(),
      email: email.trim().toLowerCase(),
      password,
    }),
  });
  const json = await parseJson(res);
  if (!res.ok) throw new Error(json.message || "Sign up failed.");
  const data = json.data as AuthPayload | undefined;
  if (!data?.token || !data.user) throw new Error("Invalid response from server.");
  return data;
}

export async function fetchMe(token: string): Promise<UserPublic> {
  const res = await fetch(`${apiBaseUrl()}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await parseJson(res);
  if (!res.ok) throw new Error(json.message || "Session expired.");
  const data = json.data as UserPublic | undefined;
  if (!data?.id) throw new Error("Invalid profile response.");
  return data;
}

export type ProfileUpdateBody = {
  name?: string;
  phone?: string;
  address?: Partial<UserAddress>;
};

export async function updateProfileRequest(token: string, body: ProfileUpdateBody): Promise<UserPublic> {
  const res = await fetch(`${apiBaseUrl()}/api/auth/profile`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const json = await parseJson(res);
  if (!res.ok) throw new Error(json.message || "Could not save profile.");
  const data = json.data as UserPublic | undefined;
  if (!data?.id) throw new Error("Invalid profile response.");
  return data;
}
