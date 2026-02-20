/**
 * GOLDEN PATH TEMPLATE — delete this folder once real features exist.
 *
 * Use-case: doThing
 *
 * Demonstrates the standard use-case pattern:
 * - Receives validated, typed input
 * - Calls port interfaces for external I/O
 * - Returns domain types or throws DomainError
 * - No HTTP concerns (no Request/Response objects)
 */

import type { ExamplePort } from "@/lib/ports/ExamplePort";
import type { DoThingInput, DoThingResult } from "../types";
import { ExampleError } from "../errors";

export async function doThing(
  input: DoThingInput,
  port: ExamplePort,
): Promise<DoThingResult> {
  const { query, limit = 10 } = input;

  const items = await port.search(query, limit);

  if (items.length === 0) {
    throw new ExampleError("NOT_FOUND", `No results for "${query}"`);
  }

  return {
    items,
    totalCount: items.length,
  };
}
