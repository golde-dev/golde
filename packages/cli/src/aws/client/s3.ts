import { logger } from "../../logger.ts";
import { AWSClientBase } from "./base.ts";
import {
  BucketAlreadyExists,
  CreateBucketCommand,
  DeleteBucketCommand,
  HeadBucketCommand,
  NotFound,
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

const clients = new Map<string, Client>();

export class S3Client extends AWSClientBase {
  public getS3Client(region: string = this.region ?? this.defaultRegion) {
    if (!clients.has(region)) {
      clients.set(
        region,
        new Client({
          region,
          credentials: {
            accessKeyId: this.accessKeyId,
            secretAccessKey: this.secretAccessKey,
          },
        }),
      );
    }
    return clients.get(region)!;
  }

  public async checkBucketExists(bucket: string, region?: string) {
    try {
      logger.debug("[AWS] Check bucket exists", { bucket });
      const command = new HeadBucketCommand({
        Bucket: bucket,
      });
      await this.getS3Client(region).send(command);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Check if bucket name is available
   */
  public async checkBucketNameAvailable(bucket: string, region?: string) {
    try {
      logger.debug("[AWS] Check bucket exists", { bucket });
      const command = new HeadBucketCommand({
        Bucket: bucket,
      });
      await this.getS3Client(region).send(command);
      return false;
    } catch (e) {
      if (e instanceof NotFound) {
        logger.debug(`[AWS] Bucket name ${name} can be used`);
        return true;
      }
      if (e instanceof BucketAlreadyExists) {
        logger.error(`[AWS] Bucket ${name} is not unique globally in s3`);
        return false;
      }
      throw e;
    }
  }

  public updateBucketVersioning(region: string, bucket: string, versioning: boolean) {
    try {
      logger.debug("[AWS] Update bucket versioning", { region, bucket, versioning });
      const command = new PutBucketVersioningCommand({
        Bucket: bucket,
        VersioningConfiguration: {
          Status: versioning ? "Enabled" : "Suspended",
        },
      });
      this.getS3Client(region)
        .send(command);
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
      logger.debug("[AWS] Creating bucket", { region, input });
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
