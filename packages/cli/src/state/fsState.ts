import { ensureDir } from "@std/fs";
import { exists } from "@std/fs/exists";
import { dirname, join } from "@std/path";
import type { AbstractStateClient, State } from "../types/state.ts";
import type { Lock } from "../types/lock.ts";

export class FSStateClient implements AbstractStateClient {
  private readonly statePath: string;
  private readonly lockPath: string;

  public constructor(
    statePath: string = "golder.state.json",
    lockPath: string = "golder.lock.json",
  ) {
    this.statePath = join(Deno.cwd(), statePath);
    this.lockPath = join(Deno.cwd(), lockPath);
  }

  /**
   * Ensure that state and lock parent directories exist
   */
  public async ensureLocation() {
    await ensureDir(dirname(this.statePath));
    await ensureDir(dirname(this.lockPath));
  }

  public async getState(): Promise<State | undefined> {
    if (!await exists(this.statePath)) {
      return;
    }
    return JSON.parse(await Deno.readTextFile(this.statePath));
  }

  public async getStateLock(): Promise<Lock[] | undefined> {
    if (!await exists(this.lockPath)) {
      return;
    }
    return JSON.parse(await Deno.readTextFile(this.lockPath));
  }
}
