import { round } from "@es-toolkit/es-toolkit";

export function printDuration(start: number, end: number) {
  const diff = end - start;

  if (diff < 1000) {
    return `${round(diff, 3)}ms`;
  } else {
    return `${round(diff / 1000, 2)}s`;
  }
}
