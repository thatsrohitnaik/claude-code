import { createTRPCProxyClient, httpBatchLink } from "@trpc/client";
import type { AppRouter } from "@lifepilot/api/src/router";

// Get API URL from environment or use default
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://localhost:4000/trpc";

// Create tRPC client
export const trpc = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: API_URL,
      headers() {
        // Get Clerk token for authentication
        return {
          // Authorization header will be set by Clerk
        };
      },
    }),
  ],
});

// Helper function to make authenticated requests
export async function authenticatedFetch<T>(
  operation: string,
  input: any
): Promise<T> {
  try {
    // For now, we'll use a simple approach
    // In production, you'd get the Clerk token
    const response = await fetch(`${API_URL}/${operation}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("API call failed:", error);
    throw error;
  }
}

// Direct fetch helper for tRPC
export async function trpcFetch<T>(procedure: string, input: any): Promise<T> {
  const response = await fetch(`${API_URL}/${procedure}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ input }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "API request failed");
  }

  return response.json();
}