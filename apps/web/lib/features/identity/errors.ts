import { DomainError } from "@/lib/shared/errors";

export class IdentityError extends DomainError {
  constructor(code: string, message: string, cause?: unknown) {
    super(code, message, cause);
    this.name = "IdentityError";
  }
}
