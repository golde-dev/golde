import { AsyncLocalStorage } from "node:async_hooks";

interface ExecutionContext {
  ignoreAlreadyDeleted: boolean;
  ignoreAlreadyCreated: boolean;
}

const storage = new AsyncLocalStorage<ExecutionContext>();

export function initExecutionContext(context: ExecutionContext): void {
  storage.enterWith(context);
}

export function getIgnoreAlreadyDeleted(): boolean {
  return storage.getStore()?.ignoreAlreadyDeleted ?? false;
}

export function getIgnoreAlreadyCreated(): boolean {
  return storage.getStore()?.ignoreAlreadyCreated ?? false;
}
