/**
 * GOLDEN PATH TEMPLATE — delete this file once real ports exist.
 *
 * Port interface for the "example" external data source.
 *
 * Ports are pure TypeScript interfaces — no runtime code, no implementations.
 * They define what a feature needs from external I/O without specifying how.
 *
 * Imported by:
 *   - lib/features/example/ (to declare dependency)
 *   - lib/adapters/example/ (to implement)
 *   - app/api/example/      (to wire adapter to use-case)
 */

import type { ExampleItem } from "@/lib/features/example/types";

export interface ExamplePort {
  search(query: string, limit: number): Promise<ExampleItem[]>;
  getById(id: string): Promise<ExampleItem | null>;
}
