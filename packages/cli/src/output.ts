import { logger } from "./logger.ts";
import type { Context } from "./types/context.ts";
import type { State } from "./types/state.ts";
import { resolveTemplate, stateTemplate } from "./utils/template.ts";
import type { Output } from "./types/output.ts";
import { formatDuration } from "./utils/duration.ts";

function resolveOutput(output: Output, state: State): object {
  const {
    data,
  } = output;

  const outputWithState = resolveTemplate(data, stateTemplate(state));
  logger.debug("[Output] Resolved state in output", { output: outputWithState });

  return outputWithState as object;
}

export function createOutput(context: Context, state: State): void {
  const {
    config: {
      output,
    },
  } = context;

  if (!output) {
    logger.info("[Output] No output defined");
    return;
  }

  logger.debug("[Output] Start output creation");
  const start = performance.now();
  const _data = resolveOutput(output, state);
  const end = performance.now();

  logger.info(`[Output] Created output in ${formatDuration(end - start)}`);
}
