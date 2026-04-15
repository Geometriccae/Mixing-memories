const apiBaseUrl = () => import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export type UserAddress = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  /** Contact at this address (required when saving). */
  phone: string;
  /** Optional second number for delivery. */
  phoneAlt: string;
};

/** Cart line shape returned from the API and stored on the user account. */
export type SavedCartLine = {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
};

/** Saved delivery slot; `id` empty until first save (legacy profile). */
export type SavedAddress = UserAddress & { id: string; label: string };

export type UserPublic = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  phone: string;
  /** Active delivery snapshot (same as selected saved address) — used for checkout checks. */
  address: UserAddress;
  /** All saved addresses; selection is `defaultAddressId`. */
  addresses?: SavedAddress[];
  defaultAddressId?: string | null;
  /** Server-persisted cart (same account, any browser). */
  savedCart?: SavedCartLine[];
  /** Server-persisted liked product ids. */
  savedLikes?: string[];
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
  if (res.status === 401) {
    throw new Error("AUTH_UNAUTHORIZED");
  }
  if (!res.ok) {
    throw new Error(json.message || "Could not load profile.");
  }
  const data = json.data as UserPublic | undefined;
  if (!data?.id) throw new Error("Invalid profile response.");
  return data;
}

export type ProfileUpdateBody = {
  name?: string;
  phone?: string;
  /** Legacy single-address update if `addresses` is not sent. */
  address?: Partial<UserAddress>;
  /** Full replace of saved addresses when provided. */
  addresses?: SavedAddress[];
  defaultAddressId?: string | null;
  /** Preferred when saving new addresses (before Mongo ids exist on client). */
  defaultAddressIndex?: number;
};

export type ShopStatePatch = {
  cart?: SavedCartLine[];
  likes?: string[];
};

export async function patchShopStateRequest(token: string, body: ShopStatePatch): Promise<UserPublic> {
  const res = await fetch(`${apiBaseUrl()}/api/auth/shop-state`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });
  const json = await parseJson(res);
  if (!res.ok) throw new Error(json.message || "Could not save cart.");
  const data = json.data as UserPublic | undefined;
  if (!data?.id) throw new Error("Invalid response.");
  return data;
}

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
