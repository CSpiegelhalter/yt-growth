import { DomainError } from "@/lib/shared/errors";

export class SuggestionError extends DomainError {
  constructor(code: string, message: string, cause?: unknown) {
    super(code, message, cause);
    this.name = "SuggestionError";
  }
}
