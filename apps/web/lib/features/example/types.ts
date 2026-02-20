/**
 * GOLDEN PATH TEMPLATE — delete this folder once real features exist.
 *
 * Domain types for the "example" feature.
 * Types here are used by use-cases, schemas, and consumers (components, routes).
 */

export type ExampleItem = {
  id: string;
  title: string;
  score: number;
  createdAt: Date;
};

export type DoThingInput = {
  userId: number;
  query: string;
  limit?: number;
};

export type DoThingResult = {
  items: ExampleItem[];
  totalCount: number;
};
