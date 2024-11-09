import { round } from "@es-toolkit/es-toolkit";

export function formatDuration(duration: number) {
  if (duration < 1000) {
    return `${round(duration, 0)}ms`;
  } else {
    return `${round(duration / 1000, 2)}s`;
  }
}
