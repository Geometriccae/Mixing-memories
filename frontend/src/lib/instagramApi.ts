import { apiBaseUrl } from "@/lib/apiConfig";

export type InstagramReelDoc = {
  _id: string;
  shortcode: string;
  url: string;
  sortOrder?: number;
};

export type ReelOembedPreview = {
  thumbnailUrl: string | null;
  title: string | null;
  authorName: string | null;
};

function parseList(json: unknown): InstagramReelDoc[] {
  if (!json || typeof json !== "object") return [];
  const data = (json as { data?: unknown }).data;
  return Array.isArray(data) ? (data as InstagramReelDoc[]) : [];
}

/** Same-origin thumbnail image (proxied by backend). */
export function reelThumbnailProxyUrl(shortcode: string): string {
  return `${apiBaseUrl}/api/instagram/thumbnail/${encodeURIComponent(shortcode)}`;
}

export function parseInstagramReelUrl(input: string): { shortcode: string; url: string } | null {
  const raw = input.trim();
  const match = raw.match(/instagram\.com\/reel\/([A-Za-z0-9_-]+)/i);
  if (!match) return null;
  const shortcode = match[1];
  return { shortcode, url: `https://www.instagram.com/reel/${shortcode}/` };
}

export async function fetchInstagramReels(): Promise<InstagramReelDoc[]> {
  try {
    const res = await fetch(`${apiBaseUrl}/api/instagram/reels`);
    if (!res.ok) return [];
    const json: unknown = await res.json();
    return parseList(json);
  } catch {
    return [];
  }
}

export async function addInstagramReel(token: string, url: string): Promise<InstagramReelDoc> {
  const res = await fetch(`${apiBaseUrl}/api/instagram/reels`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url }),
  });
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      json && typeof json === "object" && "message" in json
        ? String((json as { message?: unknown }).message)
        : "";
    throw new Error(msg || "Could not add reel.");
  }
  const data = json && typeof json === "object" ? (json as { data?: InstagramReelDoc }).data : null;
  if (!data?._id) throw new Error("Could not add reel.");
  return data;
}

export async function deleteInstagramReel(token: string, id: string): Promise<void> {
  const res = await fetch(`${apiBaseUrl}/api/instagram/reels/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
  const json: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      json && typeof json === "object" && "message" in json
        ? String((json as { message?: unknown }).message)
        : "";
    throw new Error(msg || "Could not remove reel.");
  }
}

export async function fetchReelOembedPreview(reelUrl: string): Promise<ReelOembedPreview | null> {
  try {
    const res = await fetch(
      `${apiBaseUrl}/api/instagram/oembed?url=${encodeURIComponent(reelUrl)}`,
    );
    if (!res.ok) return null;
    const json = (await res.json()) as {
      success?: boolean;
      data?: ReelOembedPreview;
    };
    return json.success && json.data ? json.data : null;
  } catch {
    return null;
  }
}
