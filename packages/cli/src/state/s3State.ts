import { NoSuchKey } from "@aws-sdk/client-s3";
import type { S3 } from "../clients/s3.ts";
import type { ConfigLock, ConfigState } from "../types/config.ts";
import type { StateClient } from "../types/state.ts";

const getStateKey = (project: string) => `/${project}/state/current.json`;
const getLockKey = (project: string) => `/${project}/state/lock.json`;

function notFoundAsUndefined<T>(
  promise: Promise<T>,
): Promise<T | undefined> {
  return promise.catch((error: unknown) => {
    if (error instanceof NoSuchKey) {
      return undefined;
    }
    throw error;
  });
}

export class S3StateClient implements StateClient {
  private readonly s3: S3;

  public constructor(s3: S3) {
    this.s3 = s3;
  }

  public getState(project: string): Promise<ConfigState | undefined> {
    const stateKey = getStateKey(project);
    return notFoundAsUndefined(this.s3.getJSONObject<ConfigState>(stateKey));
  }

  public getStateLock(project: string): Promise<ConfigLock | undefined> {
    const lockKey = getLockKey(project);
    return notFoundAsUndefined(this.s3.getJSONObject<ConfigLock>(lockKey));
  }
}
