
import logger from "../logger";
import { S3 } from "@tenacify/core";
import type { Provider } from "./provider";
import type { ConfigState } from "../types/config";
import { createReadStream } from "fs";
import { getArtifactKey } from "../utils/artifacts";

export interface StateConfig {
  bucket: string,
  region: string,
  endpoint: string,
  accessKeyId: string,
  secretAccessKey: string,
}

const getStateKey = (project: string) => `/${project}/state/current.json`;

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
      logger.error({
        error,
        bucket,
        region,
        endpoint,
        accessKeyId: "<redacted>",
        secretAccessKey: "<redacted>",
      }, "Failed to initialize state provider, please verify config");
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

  public async getCurrentState(): Promise<ConfigState | undefined> {
    const stateKey = getStateKey(this.project);
    
    return this.s3.getJSONObject<ConfigState>(stateKey);
  }
}

