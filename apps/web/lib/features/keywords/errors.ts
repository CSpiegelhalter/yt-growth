import { DomainError } from "@/lib/shared/errors";

export class KeywordError extends DomainError {
  constructor(code: string, message: string, cause?: unknown) {
    super(code, message, cause);
    this.name = "KeywordError";
  }
}
