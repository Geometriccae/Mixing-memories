const apiBaseUrl = () => import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export type OrderItemPayload = {
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

export type CreateOrderPayload = {
  customerName: string;
  email: string;
  phone?: string;
  address?: string;
  items: OrderItemPayload[];
};

export type OrderItemDoc = {
  productId?: string | null;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

export type OrderDoc = {
  _id: string;
  customerName: string;
  email: string;
  phone?: string;
  address?: string;
  items: OrderItemDoc[];
  totalAmount: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
};

function parseData<T>(json: unknown): T | null {
  if (!json || typeof json !== "object") return null;
  const data = (json as { data?: unknown }).data;
  return (data as T) ?? null;
}

export async function createOrder(payload: CreateOrderPayload): Promise<OrderDoc> {
  const res = await fetch(`${apiBaseUrl()}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json && typeof json === "object" && "message" in json ? String((json as { message?: unknown }).message) : "";
    throw new Error(msg || "Failed to place order.");
  }
  const data = parseData<OrderDoc>(json);
  if (!data || !data._id) throw new Error("Invalid order response.");
  return data;
}

export async function fetchOrdersForCustomerEmail(email: string): Promise<OrderDoc[]> {
  const q = encodeURIComponent(email.trim());
  const res = await fetch(`${apiBaseUrl()}/api/orders/customer?email=${q}`);
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json && typeof json === "object" && "message" in json ? String((json as { message?: unknown }).message) : "";
    throw new Error(msg || "Failed to load orders.");
  }
  const data = (json as { data?: unknown }).data;
  return Array.isArray(data) ? (data as OrderDoc[]) : [];
}

export async function fetchAdminOrders(token: string, status?: string | null): Promise<OrderDoc[]> {
  const base = `${apiBaseUrl()}/api/orders`;
  const url = status ? `${base}?status=${encodeURIComponent(status)}` : base;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json && typeof json === "object" && "message" in json ? String((json as { message?: unknown }).message) : "";
    throw new Error(msg || "Failed to load orders.");
  }
  const data = (json as { data?: unknown }).data;
  return Array.isArray(data) ? (data as OrderDoc[]) : [];
}

export async function patchOrderStatus(token: string, orderId: string, status: string): Promise<void> {
  const res = await fetch(`${apiBaseUrl()}/api/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json && typeof json === "object" && "message" in json ? String((json as { message?: unknown }).message) : "";
    throw new Error(msg || "Failed to update status.");
  }
}
