import type { ErrorCode } from "./constants/error";

export class CLIError extends Error {
  public code: ErrorCode;
  
  public constructor(message: string, code: ErrorCode, cause?: unknown) {
    super(message, {cause});
    this.code = code;
  }
}