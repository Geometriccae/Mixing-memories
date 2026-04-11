const apiBaseUrl = () => import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export type OrderItemPayload = {
  productId?: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
};

export type ShippingAddressPayload = {
  line1: string;
  line2: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
};

export type CreateOrderPayload = {
  items: OrderItemPayload[];
  paymentMethod: "cod" | "upi" | "online";
  /** Optional: if omitted, backend uses profile address */
  shippingAddress?: Partial<ShippingAddressPayload>;
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
  /** Friendly order id for invoices (from server) */
  orderNumber?: string;
  userId?: string | null;
  customerName: string;
  email: string;
  phone?: string;
  shippingAddress?: ShippingAddressPayload;
  paymentMethod?: "cod" | "upi" | "online" | string;
  paymentStatus?: "pending" | "paid" | "failed" | string;
  items: OrderItemDoc[];
  totalAmount: number;
  status: string;
  cancelledBy?: "user" | "admin" | null;
  cancelReason?: string;
  createdAt?: string;
  updatedAt?: string;
};

function parseData<T>(json: unknown): T | null {
  if (!json || typeof json !== "object") return null;
  const data = (json as { data?: unknown }).data;
  return (data as T) ?? null;
}

export async function createOrder(token: string, payload: CreateOrderPayload): Promise<OrderDoc> {
  const res = await fetch(`${apiBaseUrl()}/api/orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
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

export async function fetchMyOrders(token: string): Promise<OrderDoc[]> {
  const res = await fetch(`${apiBaseUrl()}/api/orders/my`, {
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

export type AdminOrderFilters = {
  orderStatus?: string | null;
  paymentStatus?: string | null;
};

export async function fetchAdminOrders(
  token: string,
  filters?: AdminOrderFilters | string | null,
): Promise<OrderDoc[]> {
  const base = `${apiBaseUrl()}/api/orders`;
  let orderStatus: string | undefined;
  let paymentStatus: string | undefined;
  if (typeof filters === "string") orderStatus = filters;
  else if (filters && typeof filters === "object") {
    orderStatus = filters.orderStatus ?? undefined;
    paymentStatus = filters.paymentStatus ?? undefined;
  }
  const params = new URLSearchParams();
  if (orderStatus) params.set("status", orderStatus);
  if (paymentStatus) params.set("paymentStatus", paymentStatus);
  const q = params.toString();
  const url = q ? `${base}?${q}` : base;
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

export async function patchOrderPaymentStatus(token: string, orderId: string, paymentStatus: string): Promise<void> {
  const res = await fetch(`${apiBaseUrl()}/api/orders/${orderId}/payment-status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ paymentStatus }),
  });
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json && typeof json === "object" && "message" in json ? String((json as { message?: unknown }).message) : "";
    throw new Error(msg || "Failed to update payment status.");
  }
}

export async function patchOrderStatus(
  token: string,
  orderId: string,
  status: string,
  cancelReason?: string,
): Promise<void> {
  const body: { status: string; cancelReason?: string } = { status };
  if (status === "cancelled" && cancelReason != null && cancelReason.trim()) {
    body.cancelReason = cancelReason.trim();
  }
  const res = await fetch(`${apiBaseUrl()}/api/orders/${orderId}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json && typeof json === "object" && "message" in json ? String((json as { message?: unknown }).message) : "";
    throw new Error(msg || "Failed to update status.");
  }
}

export async function cancelMyOrder(token: string, orderId: string): Promise<OrderDoc> {
  const res = await fetch(`${apiBaseUrl()}/api/orders/${orderId}/cancel`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = json && typeof json === "object" && "message" in json ? String((json as { message?: unknown }).message) : "";
    throw new Error(msg || "Failed to cancel order.");
  }
  const data = parseData<OrderDoc>(json);
  if (!data || !data._id) throw new Error("Invalid cancel response.");
  return data;
}
