import type { Context } from "./context";

export async function planChanges(
  context: Context
) {
  const {
    nextConfig,
    nextState,
    previousConfig,
    previousState,
  } = context;

  console.log({
    nextConfig,
    nextState,
    previousConfig,
    previousState,
  });
  return Promise.resolve({});
}