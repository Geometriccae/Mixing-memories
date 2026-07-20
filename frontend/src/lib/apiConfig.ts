/**
 * Utility to determine the API base URL automatically.
 * In `npm run dev`, use same-origin + Vite proxy (/api → localhost:5000)
 * so admin/storefront login works without CORS/cross-host fetch failures.
 * Production uses VITE_API_BASE_URL from .env, unless window.__ROYAL_OVEN_API__ is set
 * (see public/api-base-url.js — editable on Hostinger without rebuild).
 */
export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  const localUrl = import.meta.env.VITE_LOCAL_API_BASE_URL || "http://localhost:5000";

  // Development: empty base → fetch("/api/...") goes through Vite proxy
  if (import.meta.env.DEV) {
    return "";
  }

  if (typeof window !== "undefined") {
    const runtime = (window as Window & { __ROYAL_OVEN_API__?: string }).__ROYAL_OVEN_API__;
    if (typeof runtime === "string" && runtime.trim()) {
      return runtime.trim().replace(/\/$/, "");
    }
  }

  // Local production preview (vite preview) on localhost
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return localUrl;
    }
  }

  return envUrl || localUrl;
};

export const apiBaseUrl = getApiBaseUrl();
