import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import type {
  GetCallerIdentityCommandInput,
  GetCallerIdentityCommandOutput,
} from "@aws-sdk/client-sts";
import { logger } from "../../logger.ts";

export class AWSClientBase {
  protected readonly accessKeyId: string;
  protected readonly secretAccessKey: string;
  protected readonly region?: string;

  constructor(accessKeyId: string, secretAccessKey: string, region?: string) {
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.region = region;
  }

  public async verifyCredentials(): Promise<void> {
    try {
      const command = new GetCallerIdentityCommand();
      const stsClient = new STSClient({
        region: this.region ?? "us-east-1",
        credentials: {
          accessKeyId: this.accessKeyId,
          secretAccessKey: this.secretAccessKey,
        },
      });
      const result = await stsClient
        .send<
          GetCallerIdentityCommandInput,
          GetCallerIdentityCommandOutput
        >(command);
      logger.debug("Verified AWS credentials result", result);
    } catch (error) {
      throw error;
    }
  }
}
