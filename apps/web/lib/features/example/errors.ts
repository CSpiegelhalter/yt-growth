/**
 * GOLDEN PATH TEMPLATE — delete this folder once real features exist.
 *
 * Domain errors for the "example" feature.
 * Extend DomainError with a feature-specific name.
 */

import { DomainError } from "@/lib/shared/errors";

export class ExampleError extends DomainError {
  constructor(code: string, message: string, cause?: unknown) {
    super(code, message, cause);
    this.name = "ExampleError";
  }
}
