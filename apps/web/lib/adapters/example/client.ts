/**
 * GOLDEN PATH TEMPLATE — delete this folder once real adapters exist.
 *
 * Adapter implementing ExamplePort.
 *
 * Demonstrates the standard adapter pattern:
 * - Implements a port interface
 * - Handles HTTP/SDK calls, caching, retries
 * - Maps external data to port-defined types
 * - No business logic (if/else based on business rules belongs in features)
 */

import type { ExamplePort } from "@/lib/ports/ExamplePort";
import type { ExampleItem } from "@/lib/features/example/types";

const API_BASE = "https://api.example.com/v1";

export function createExampleClient(apiKey: string): ExamplePort {
  async function fetchJson<T>(path: string): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!res.ok) {
      throw new Error(`Example API error: ${res.status} ${res.statusText}`);
    }
    return res.json() as Promise<T>;
  }

  return {
    async search(query, limit) {
      type ApiResponse = { results: Array<{ id: string; name: string; rank: number; created: string }> };
      const data = await fetchJson<ApiResponse>(
        `/search?q=${encodeURIComponent(query)}&limit=${limit}`,
      );
      return data.results.map(mapToExampleItem);
    },

    async getById(id) {
      type ApiItem = { id: string; name: string; rank: number; created: string };
      try {
        const data = await fetchJson<ApiItem>(`/items/${encodeURIComponent(id)}`);
        return mapToExampleItem(data);
      } catch {
        return null;
      }
    },
  };
}

function mapToExampleItem(raw: {
  id: string;
  name: string;
  rank: number;
  created: string;
}): ExampleItem {
  return {
    id: raw.id,
    title: raw.name,
    score: raw.rank,
    createdAt: new Date(raw.created),
  };
}
