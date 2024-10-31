import { memoize } from "@es-toolkit/es-toolkit";
import { AWSClientBase } from "./base.ts";
import {
  CreateBucketCommand,
  DeleteBucketCommand,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
  PutBucketTaggingCommand,
  PutBucketVersioningCommand,
  S3Client as Client,
} from "@aws-sdk/client-s3";
import type {
  CORSConfiguration,
  CreateBucketCommandInput,
  CreateBucketCommandOutput,
  PutBucketPolicyCommandInput,
  PutBucketPolicyCommandOutput,
  PutBucketTaggingCommandInput,
  PutBucketTaggingCommandOutput,
  Tag,
} from "@aws-sdk/client-s3";
import { logger } from "../../logger.ts";

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
    try {
      logger.debug("[AWS] Update bucket versioning", { region, bucket, versioning });
      const command = new PutBucketVersioningCommand({
        Bucket: bucket,
        VersioningConfiguration: {
          Status: versioning ? "Enabled" : "Suspended",
        },
      });
      this.getS3Client(region).send(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error("[AWS] Failed to update bucket versioning", e);
      }
      throw e;
    }
  }

  public async updateBucketCors(region: string, bucket: string, cors: CORSConfiguration) {
    try {
      logger.debug("[AWS] Update bucket versioning", { region, bucket, cors });

      const command = new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: cors,
      });
      await this
        .getS3Client(region)
        .send(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error("[AWS] Failed to update bucket cors policy", e);
      }
      throw e;
    }
  }

  public async updateBucketPolicy(region: string, bucket: string, policy: string) {
    try {
      logger.debug("[AWS] Update bucket policy", { region, bucket, policy });

      const command = new PutBucketPolicyCommand({
        Bucket: bucket,
        Policy: policy,
      });
      await this
        .getS3Client(region)
        .send<PutBucketPolicyCommandInput, PutBucketPolicyCommandOutput>(
          command,
        );
    } catch (e) {
      if (e instanceof Error) {
        logger.error("[AWS] Failed to update bucket policy", e);
      }
      throw e;
    }
  }

  public async updateBucketTags(region: string, bucket: string, tags: Tag[]) {
    try {
      logger.debug("[AWS] Update bucket tags", { region, bucket, tags });

      const command = new PutBucketTaggingCommand({
        Bucket: bucket,
        Tagging: {
          TagSet: tags,
        },
      });
      await this
        .getS3Client(region)
        .send<PutBucketTaggingCommandInput, PutBucketTaggingCommandOutput>(
          command,
        );
    } catch (e) {
      if (e instanceof Error) {
        logger.error("[AWS] Failed to update bucket tags", e);
      }
      throw e;
    }
  }

  public async createBucket(
    region: string,
    input: CreateBucketCommandInput,
  ): Promise<CreateBucketCommandOutput> {
    try {
      logger.debug("[AWS] Create bucket", { region, input });

      const command = new CreateBucketCommand(input);
      const result = await this
        .getS3Client(region)
        .send<CreateBucketCommandInput, CreateBucketCommandOutput>(
          command,
        );
      return result;
    } catch (e) {
      if (e instanceof Error) {
        logger.error("[AWS] Failed to create bucket", e);
      }
      throw e;
    }
  }

  public async deleteBucket(region: string, bucket: string): Promise<void> {
    try {
      logger.debug("[AWS] delete bucket", { region, bucket });

      const command = new DeleteBucketCommand({
        Bucket: bucket,
      });
      await this
        .getS3Client(region)
        .send(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error("[AWS] Failed to delete bucket", e);
      }
      throw e;
    }
  }
}
