/**
 * GOLDEN PATH TEMPLATE — delete this folder once real feature components exist.
 *
 * Client component for the "example" feature.
 *
 * Demonstrates:
 * - 'use client' directive for interactive components
 * - Importing types from lib/features/ (NOT adapters)
 * - Using lib/client/api.ts for data fetching
 * - Loading/error/empty states per style rules
 */

"use client";

import { useState } from "react";
import type { DoThingResult } from "@/lib/features/example";
import { apiFetchJson } from "@/lib/client/api";

type Props = {
  initialQuery?: string;
};

export function ExampleWidget({ initialQuery = "" }: Props) {
  const [query, setQuery] = useState(initialQuery);
  const [result, setResult] = useState<DoThingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);

    try {
      const data = await apiFetchJson<DoThingResult>(
        `/api/example?query=${encodeURIComponent(query)}`,
      );
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search..."
          aria-label="Search query"
        />
        <button onClick={handleSearch} disabled={loading || !query.trim()}>
          {loading ? "Searching..." : "Search"}
        </button>
      </div>

      {error && <p role="alert">{error}</p>}

      {result && result.items.length === 0 && (
        <p>No results found. Try a different query.</p>
      )}

      {result && result.items.length > 0 && (
        <ul>
          {result.items.map((item) => (
            <li key={item.id}>
              {item.title} (score: {item.score})
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
