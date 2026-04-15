const apiBaseUrl = () => import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export type TestimonialDoc = {
  _id: string;
  name: string;
  text: string;
  rating: number;
  avatar: string;
  status?: "pending" | "approved";
};

function parseList(json: unknown): TestimonialDoc[] {
  if (!json || typeof json !== "object") return [];
  const data = (json as { data?: unknown }).data;
  return Array.isArray(data) ? (data as TestimonialDoc[]) : [];
}

/** Public storefront: approved reviews only. */
export async function fetchTestimonials(): Promise<TestimonialDoc[]> {
  const res = await fetch(`${apiBaseUrl()}/api/testimonials`);
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) return [];
  return parseList(json);
}

/** Admin: all reviews including pending. */
export async function fetchAllTestimonials(token: string): Promise<TestimonialDoc[]> {
  const res = await fetch(`${apiBaseUrl()}/api/testimonials/all`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      json && typeof json === "object" && "message" in json ? String((json as { message?: unknown }).message) : "";
    throw new Error(msg || "Failed to load testimonials.");
  }
  return parseList(json);
}

export async function submitCustomerReview(
  token: string,
  payload: { text: string; rating?: number },
): Promise<TestimonialDoc> {
  const res = await fetch(`${apiBaseUrl()}/api/testimonials/submit`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      json && typeof json === "object" && "message" in json ? String((json as { message?: unknown }).message) : "";
    throw new Error(msg || "Failed to submit review.");
  }
  if (!json || typeof json !== "object" || !("data" in json)) {
    throw new Error("Invalid response.");
  }
  return (json as { data: TestimonialDoc }).data;
}

export async function approveTestimonial(token: string, id: string): Promise<TestimonialDoc> {
  const res = await fetch(`${apiBaseUrl()}/api/testimonials/${encodeURIComponent(id)}/approve`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      json && typeof json === "object" && "message" in json ? String((json as { message?: unknown }).message) : "";
    throw new Error(msg || "Failed to approve.");
  }
  if (!json || typeof json !== "object" || !("data" in json)) {
    throw new Error("Invalid response.");
  }
  return (json as { data: TestimonialDoc }).data;
}

export async function createTestimonial(
  token: string,
  payload: { name: string; text: string; rating?: number },
): Promise<TestimonialDoc> {
  const res = await fetch(`${apiBaseUrl()}/api/testimonials`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      json && typeof json === "object" && "message" in json ? String((json as { message?: unknown }).message) : "";
    throw new Error(msg || "Failed to add testimonial.");
  }
  if (!json || typeof json !== "object" || !("data" in json)) {
    throw new Error("Invalid response.");
  }
  return (json as { data: TestimonialDoc }).data;
}

export async function deleteTestimonial(token: string, id: string): Promise<void> {
  const res = await fetch(`${apiBaseUrl()}/api/testimonials/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      json && typeof json === "object" && "message" in json ? String((json as { message?: unknown }).message) : "";
    throw new Error(msg || "Failed to delete.");
  }
}
