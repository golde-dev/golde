import { logger } from "../../logger.ts";
import { GetCallerIdentityCommand, STSClient } from "@aws-sdk/client-sts";
import { IAMClient, SimulatePrincipalPolicyCommand } from "@aws-sdk/client-iam";
import type {
  ContextEntry,
  SimulatePrincipalPolicyCommandInput,
  SimulatePrincipalPolicyCommandOutput,
} from "@aws-sdk/client-iam";
import type {
  GetCallerIdentityCommandInput,
  GetCallerIdentityCommandOutput,
} from "@aws-sdk/client-sts";

const iamClients = new Map<string, IAMClient>();

const Allowed = "allowed";

export class AWSClientBase {
  protected readonly accessKeyId: string;
  protected readonly secretAccessKey: string;

  public readonly region?: string;
  public readonly defaultRegion = "us-east-2";

  public userId?: string;
  public accountId?: string;
  public arn?: string;
  public isRoot: boolean = false;

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

      this.isRoot = result.Arn === `arn:aws:iam::${result.Account}:root`;

      logger.debug(result, "[AWS] Verified AWS credentials:");
    } catch (error) {
      throw error;
    }
  }

  public getIAMClient(region: string = this.region ?? this.defaultRegion) {
    if (!iamClients.has(region)) {
      iamClients.set(
        region,
        new IAMClient({
          region,
          credentials: {
            accessKeyId: this.accessKeyId,
            secretAccessKey: this.secretAccessKey,
          },
        }),
      );
    }
    return iamClients.get(region)!;
  }

  public async checkPermission(
    actions: string[],
    resources: string[],
    contextEntries: ContextEntry[] = [],
  ) {
    try {
      if (this.isRoot) {
        logger.debug(
          {
          actions,
          resources,
        },
        "[AWS] Skipping permission simulation for root account");
        return [true, []];
      }
      logger.debug({ actions, resources, contextEntries }, "[AWS] Checking permission");
      const command = new SimulatePrincipalPolicyCommand({
        PolicySourceArn: this.arn,
        ActionNames: actions,
        ResourceArns: resources,
        ContextEntries: contextEntries,
      });
      const { EvaluationResults } = await this
        .getIAMClient()
        .send<SimulatePrincipalPolicyCommandInput, SimulatePrincipalPolicyCommandOutput>(command);

      const Result = actions.every((action) => {
        return EvaluationResults?.find(({ EvalActionName, EvalDecision }) =>
          EvalActionName === action && EvalDecision === Allowed
        );
      });
      return [Result, EvaluationResults];
    } catch (e) {
      if (e instanceof Error) {
        logger.error(e, "[AWS] Failed to check permission");
      }
      throw e;
    }
  }
}
