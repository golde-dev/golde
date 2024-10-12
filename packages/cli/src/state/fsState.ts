import type { ConfigLock, ConfigState } from "../types/config.ts";
import type { StateClient } from "../types/state.ts";
import { exists } from "@std/fs/exists";

export class FSStateClient implements StateClient {
  private readonly statePath: string;
  private readonly lockPath: string;

  public constructor(
    statePath: string = "golder.state.json",
    lockPath: string = "golder.lock.json",
  ) {
    this.statePath = statePath;
    this.lockPath = lockPath;
  }

  public async getState(): Promise<ConfigState | undefined> {
    if (!await exists(this.statePath)) {
      return;
    }
    return JSON.parse(await Deno.readTextFile(this.statePath));
  }

  public async getStateLock(): Promise<ConfigLock | undefined> {
    if (!await exists(this.lockPath)) {
      return;
    }
    return JSON.parse(await Deno.readTextFile(this.lockPath));
  }
}
