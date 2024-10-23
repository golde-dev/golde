import { AWSClientBase } from "./base.ts";
import { CreateBucketCommand, DeleteBucketCommand, S3Client as Client } from "@aws-sdk/client-s3";
import type { CreateBucketCommandInput, CreateBucketCommandOutput } from "@aws-sdk/client-s3";
import { memoize } from "moderndash";

export class S3Client extends AWSClientBase {
  private getS3Client = memoize(() => {
    return new Client({
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });
  });

  public async createBucket(input: CreateBucketCommandInput): Promise<CreateBucketCommandOutput> {
    const command = new CreateBucketCommand(input);
    return await this.getS3Client().send(command);
  }

  public async deleteBucket(bucketName: string): Promise<void> {
    const command = new DeleteBucketCommand({
      Bucket: bucketName,
    });
    await this.getS3Client().send(command);
  }
}
