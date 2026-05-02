/**
 * Utility to determine the API base URL automatically.
 * It uses the local backend if running on localhost or in development mode, 
 * otherwise it uses the VITE_API_BASE_URL from .env.
 */
export const getApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_BASE_URL;
  const localUrl = import.meta.env.VITE_LOCAL_API_BASE_URL || "http://localhost:5000";

  // Check if we are in development mode (npm run dev)
  if (import.meta.env.DEV) {
    return localUrl;
  }

  // Fallback for production if for some reason we want to override via hostname
  if (typeof window !== "undefined") {
    const { hostname } = window.location;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return localUrl;
    }
  }

  return envUrl || localUrl;
};

export const apiBaseUrl = getApiBaseUrl();
