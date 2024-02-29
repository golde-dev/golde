import type { Context } from "./context";

export async function planChanges(
  context: Context
) {
  const {
    currentConfig,
    currentState,
    previousConfig,
    previousState,
  } = context;

  console.log({
    currentConfig,
    currentState,
    previousConfig,
    previousState,
  });
  return Promise.resolve({});
}