export function getErrorMessage(error: undefined): undefined;
export function getErrorMessage(error: unknown): string;
export function getErrorMessage(error: unknown): string | undefined {
  if (!error) {
    return;
  }
  return error instanceof Error ? error.message : String(error);
}
