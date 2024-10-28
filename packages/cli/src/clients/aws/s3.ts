import { memoize } from "moderndash";
import { AWSClientBase } from "./base.ts";
import {
  CreateBucketCommand,
  DeleteBucketCommand,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
  PutBucketVersioningCommand,
  S3Client as Client,
} from "@aws-sdk/client-s3";
import type {
  CORSConfiguration,
  CreateBucketCommandInput,
  CreateBucketCommandOutput,
  PutBucketPolicyCommandInput,
  PutBucketPolicyCommandOutput,
} from "@aws-sdk/client-s3";

export class S3Client extends AWSClientBase {
  private getS3Client = memoize((region: string) => {
    return new Client({
      region,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });
  });

  public updateBucketVersioning(region: string, bucket: string, versioning: boolean) {
    const command = new PutBucketVersioningCommand({
      Bucket: bucket,
      VersioningConfiguration: {
        Status: versioning ? "Enabled" : "Suspended",
      },
    });
    this.getS3Client(region).send(command);
  }

  public async updateBucketCors(region: string, bucket: string, cors: CORSConfiguration) {
    const command = new PutBucketCorsCommand({
      Bucket: bucket,
      CORSConfiguration: cors,
    });
    await this
      .getS3Client(region)
      .send(command);
  }

  public async updateBucketPolicy(region: string, bucket: string, policy: string) {
    const command = new PutBucketPolicyCommand({
      Bucket: bucket,
      Policy: policy,
    });
    await this
      .getS3Client(region)
      .send<PutBucketPolicyCommandInput, PutBucketPolicyCommandOutput>(
        command,
      );
  }

  public async createBucket(
    region: string,
    input: CreateBucketCommandInput,
  ): Promise<CreateBucketCommandOutput> {
    const command = new CreateBucketCommand(input);
    return await this
      .getS3Client(region)
      .send<CreateBucketCommandInput, CreateBucketCommandOutput>(
        command,
      );
  }

  public async deleteBucket(region: string, bucketName: string): Promise<void> {
    const command = new DeleteBucketCommand({
      Bucket: bucketName,
    });
    await this
      .getS3Client(region)
      .send(command);
  }
}
