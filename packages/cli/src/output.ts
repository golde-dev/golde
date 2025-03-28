import { logger } from "./logger.ts";
import type { Context } from "./types/context.ts";
import type { State } from "./types/state.ts";
import { formatDuration } from "./utils/duration.ts";
import { isEmpty } from "@es-toolkit/es-toolkit/compat";

export function createOutputs(context: Context, state: State): void {
  const {
    config: { output },
  } = context;

  if (isEmpty(output)) {
    logger.info("[Output] No output defined");
    return;
  }
  logger.debug("[Output] Start output creation");
  const start = performance.now();

  const end = performance.now();
  logger.info(`[Output] Created output in ${formatDuration(end - start)}`);
}
