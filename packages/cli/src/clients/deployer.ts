/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/class-methods-use-this */

import type { StateConfig } from "../providers/state";


export class DeployerClient {
  private readonly apiKey: string;
  private readonly baseUrl = "https://deployer.dev/v1";

  public constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  public async verifyUserToken(): Promise<void> {
    return Promise.resolve();
  }

  public async registerStateConfig(stateConfig: StateConfig): Promise<void> {
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    stateConfig;
    return Promise.resolve();
  }

  public async getStateConfig(): Promise<StateConfig> {
    return Promise.resolve({
      region: "auto",
      bucket: process.env.S3_BUCKET!,
      endpoint: process.env.S3_ENDPOINT!,
      accessKeyId: process.env.S3_API_KEY!,
      secretAccessKey: process.env.S3_API_SECRET!,
    });
  }
}
