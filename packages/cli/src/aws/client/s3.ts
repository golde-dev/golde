import { logger } from "../../logger.ts";
import { AWSClientBase } from "./base.ts";
import {
  BucketAlreadyExists,
  CreateBucketCommand,
  DeleteBucketCommand,
  DeleteObjectCommand,
  HeadBucketCommand,
  HeadObjectCommand,
  NotFound,
  PutBucketCorsCommand,
  PutBucketPolicyCommand,
  PutBucketTaggingCommand,
  PutBucketVersioningCommand,
  PutObjectCommand,
  PutObjectTaggingCommand,
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
  PutObjectCommandInput,
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
          requestChecksumCalculation: "WHEN_REQUIRED",
          responseChecksumValidation: "WHEN_REQUIRED",
        }),
      );
    }
    return clients.get(region)!;
  }

  public async checkS3BucketExists(bucket: string, region?: string) {
    try {
      logger.debug("[AWS] Check s3 bucket exists", { bucket });
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
  public async checkS3BucketNameAvailable(bucket: string, region?: string) {
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

  public updateS3BucketVersioning(region: string, bucket: string, versioning: boolean) {
    try {
      logger.debug("[AWS] Update s3 bucket versioning", { region, bucket, versioning });
      const command = new PutBucketVersioningCommand({
        Bucket: bucket,
        VersioningConfiguration: {
          Status: versioning ? "Enabled" : "Suspended",
        },
      });
      this
        .getS3Client(region)
        .send(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error("[AWS] Failed to update bucket versioning", e);
      }
      throw e;
    }
  }

  public async updateS3BucketCors(region: string, bucket: string, cors: CORSConfiguration) {
    try {
      logger.debug("[AWS] Update s3 bucket versioning", { region, bucket, cors });

      const command = new PutBucketCorsCommand({
        Bucket: bucket,
        CORSConfiguration: cors,
      });
      await this
        .getS3Client(region)
        .send(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error("[AWS] Failed to update s3 bucket cors policy", e);
      }
      throw e;
    }
  }

  public async updateBucketPolicy(region: string, bucket: string, policy: string) {
    try {
      logger.debug("[AWS] Update s3 bucket policy", { region, bucket, policy });

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
        logger.error("[AWS] Failed to update s3 bucket policy", e);
      }
      throw e;
    }
  }

  public async updateS3BucketTags(region: string, bucket: string, tags: Tag[]) {
    try {
      logger.debug("[AWS] Update s3 bucket tags", { region, bucket, tags });

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
        logger.error("[AWS] Failed to update s3 bucket tags", e);
      }
      throw e;
    }
  }

  public async createS3Bucket(
    region: string,
    input: CreateBucketCommandInput,
  ): Promise<CreateBucketCommandOutput> {
    try {
      logger.debug("[AWS] Creating s3 bucket", { region, input });
      const command = new CreateBucketCommand(input);
      const result = await this
        .getS3Client(region)
        .send<CreateBucketCommandInput, CreateBucketCommandOutput>(
          command,
        );
      return result;
    } catch (e) {
      if (e instanceof Error) {
        logger.error("[AWS] Failed to create s3 bucket", e);
      }
      throw e;
    }
  }

  public async deleteBucket(region: string, bucket: string): Promise<void> {
    try {
      logger.debug("[AWS] delete s3 bucket", { region, bucket });

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

  public async putS3Object(
    input: PutObjectCommandInput,
  ) {
    try {
      logger.debug("[AWS] Create s3 object", {
        Bucket: input.Bucket,
        Key: input.Key,
      });
      const command = new PutObjectCommand(input);
      await this
        .getS3Client()
        .send(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error("[AWS] Failed to create s3 object", e);
      }
      throw e;
    }
  }

  public async putS3ObjectTags(
    bucket: string,
    key: string,
    tags: Tag[],
  ) {
    try {
      logger.debug("[AWS] Update s3 object tags", { bucket, key, tags });

      const command = new PutObjectTaggingCommand({
        Bucket: bucket,
        Key: key,
        Tagging: {
          TagSet: tags,
        },
      });
      await this
        .getS3Client()
        .send(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error("[AWS] Failed to update s3 object tags", e);
      }
      throw e;
    }
  }

  public async checkS3ObjectExists(bucketName: string, key: string): Promise<boolean> {
    try {
      logger.debug("[AWS] Check s3 object exists", {
        Bucket: bucketName,
        Key: key,
      });
      const command = new HeadObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      await this.getS3Client()
        .send(command);
      return true;
    } catch (e) {
      if (e instanceof NotFound) {
        return false;
      }
      logger.error("[AWS] Failed to check s3 object exists", e);
      throw e;
    }
  }

  public async deleteS3Object(bucketName: string, key: string): Promise<void> {
    try {
      logger.debug("[AWS] Delete s3 object", {
        Bucket: bucketName,
        Key: key,
      });
      const command = new DeleteObjectCommand({
        Bucket: bucketName,
        Key: key,
      });
      await this
        .getS3Client()
        .send(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error("[AWS] Failed to delete s3 object", e);
      }
      throw e;
    }
  }
}
