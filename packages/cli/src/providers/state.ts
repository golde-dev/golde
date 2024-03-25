
import logger from "../logger";
import { S3 } from "@tenacify/core";
import type { Provider } from "./types";
import { NoSuchKey } from "@aws-sdk/client-s3";
import type { ConfigLock, ConfigState } from "../types/config";
import { createReadStream } from "fs";
import { getArtifactKey } from "../utils/artifacts";

export interface StateConfig {
  type: "s3",
  bucket: string,
  region: string,
  endpoint: string,
  accessKeyId: string,
  secretAccessKey: string,
}

const getStateKey = (project: string) => `/${project}/state/current.json`;
const getLockKey = (project: string) => `/${project}/state/lock.json`;

async function notFoundAsUndefined<T>(promise: Promise<T>): Promise<T | undefined> {
  return promise.catch((error: unknown) => {
    if (error instanceof NoSuchKey) {
      return undefined;
    }
    throw error;
  });
}

export class StateProvider implements Provider {
  private readonly project: string = "new-project";
  private readonly s3: S3;

  private constructor(project: string, s3: S3) {
    this.project = project;
    this.s3 = s3;
  }

  public static async init(project: string, { bucket, region, endpoint, accessKeyId, secretAccessKey }: StateConfig): Promise<StateProvider> {
    const s3 = new S3({
      bucket,
      logger,
      region,
      endpoint,
      accessKeyId,
      secretAccessKey,
    });
    try {
      await s3.verifyAccess();
      return new StateProvider(project, s3);
    }
    catch (error) {
      logger.error("Failed to initialize state provider, please verify config",
        {
          error,
          bucket,
          region,
          endpoint,
          accessKeyId: "<redacted>",
          secretAccessKey: "<redacted>",
        } 
      );
      throw error;
    }
  }

  /**
   * Upload file to s3 artifact store for project
   */
  public async uploadArtefact(path: string, key: string) {
    const readable = createReadStream(path);
    const artifactKey = getArtifactKey(this.project, key);

    return this.s3.putObject(artifactKey, readable);
  }

  public async getState(): Promise<ConfigState | undefined> {
    const stateKey = getStateKey(this.project);
    return notFoundAsUndefined(this.s3.getJSONObject<ConfigState>(stateKey));
  }

  public async getLock(): Promise<ConfigLock | undefined> {
    const lockKey = getLockKey(this.project);
    return notFoundAsUndefined(this.s3.getJSONObject<ConfigLock>(lockKey));
  }
}

