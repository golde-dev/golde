import { logger } from "../../logger.ts";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import type {
  GetCallerIdentityCommandInput,
  GetCallerIdentityCommandOutput,
} from "@aws-sdk/client-sts";

export class AWSClientBase {
  protected readonly accessKeyId: string;
  protected readonly secretAccessKey: string;

  public readonly region?: string;
  public readonly defaultRegion = "us-east-2";

  public userId?: string;
  public accountId?: string;
  public arn?: string;

  constructor(accessKeyId: string, secretAccessKey: string, region?: string) {
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
    this.region = region;
  }

  public async verifyCredentials(): Promise<void> {
    try {
      const command = new GetCallerIdentityCommand();
      const stsClient = new STSClient({
        region: this.region ?? this.defaultRegion,
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

      this.userId = result.UserId;
      this.accountId = result.Account;
      this.arn = result.Arn;

      logger.debug("Verified AWS credentials:", result);
    } catch (error) {
      throw error;
    }
  }
}
