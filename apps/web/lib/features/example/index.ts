/**
 * GOLDEN PATH TEMPLATE — delete this folder once real features exist.
 *
 * Barrel file: re-exports only. No logic, no side effects.
 */

export type { ExampleItem, DoThingInput, DoThingResult } from "./types";
export type { DoThingQuery } from "./schemas";
export { DoThingQuerySchema } from "./schemas";
export { ExampleError } from "./errors";
export { doThing } from "./use-cases/doThing";
