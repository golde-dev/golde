import { applyMixins } from "../../utils/mixin.ts";
import { AWSClientBase } from "./base.ts";
import { S3Client } from "./s3.ts";

export class AWSClient extends AWSClientBase {
  constructor(apiToken: string, accountId: string) {
    super(apiToken, accountId);
  }
}

export interface AWSClient extends S3Client {}

applyMixins(AWSClient, [
  S3Client,
]);
