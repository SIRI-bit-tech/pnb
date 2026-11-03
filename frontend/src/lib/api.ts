/**
 * Centralized API Base URL resolver.
 * 
 * Guarantees that whether NEXT_PUBLIC_API_URL is set with or without trailing '/api',
 * it resolves cleanly to the full API base endpoint.
 */
export function getApiBase(): string {
  let url = process.env.NEXT_PUBLIC_API_URL;
  if (url) {
    url = url.trim().replace(/\/$/, "");
    if (!url.endsWith("/api")) {
      url += "/api";
    }
    return url;
  }
  if (typeof window !== "undefined") {
    return "/api";
  }
  return "http://localhost:8000/api";
}
