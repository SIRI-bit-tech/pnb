import * as Ably from "ably";

let ablyClient: Ably.Realtime | null = null;

export function getAblyClient(): Ably.Realtime | null {
  if (typeof window === "undefined") return null;

  const apiKey = process.env.NEXT_PUBLIC_ABLY_API_KEY;
  if (!apiKey) {
    console.warn("NEXT_PUBLIC_ABLY_API_KEY is not defined. Real-time updates will use polling fallback.");
    return null;
  }

  if (!ablyClient) {
    try {
      ablyClient = new Ably.Realtime({
        key: apiKey,
        autoConnect: true,
      });
    } catch (err) {
      console.error("Failed to initialize Ably Realtime client:", err);
      return null;
    }
  }

  return ablyClient;
}
