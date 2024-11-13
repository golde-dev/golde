import { applyMixins } from "../../utils/mixin.ts";
import { AWSClientBase } from "./base.ts";
import { CloudwatchClient } from "./cloudwatch.ts";
import { IAMClient } from "./iam.ts";
import { LambdaClient } from "./lambda.ts";
import { Route53Client } from "./route53.ts";
import { S3Client } from "./s3.ts";
import { TaggingClient } from "./tagging.ts";

export class AWSClient extends AWSClientBase {
  constructor(accessKeyId: string, secretAccessKey: string, region?: string) {
    super(accessKeyId, secretAccessKey, region);
  }
}

export interface AWSClient
  extends S3Client, Route53Client, LambdaClient, IAMClient, CloudwatchClient, TaggingClient {}

applyMixins(AWSClient, [
  S3Client,
  Route53Client,
  LambdaClient,
  IAMClient,
  CloudwatchClient,
  TaggingClient,
]);
