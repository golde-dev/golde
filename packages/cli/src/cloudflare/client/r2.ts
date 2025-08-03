import { logger } from "../../logger.ts";
import type { Region, StorageClass } from "./types.ts";
import { CloudflareBase, CloudflareError } from "./base.ts";

/**
 * @see https://developers.cloudflare.com/api/operations/r2-create-bucket
 */
interface BucketRequest {
  "name": string;
  "locationHint"?: Region;
  "storageClass"?: StorageClass;
}

interface Bucket {
  "creation_date": string;
  "location": Region;
  "name": string;
  "storage_class": StorageClass;
}

export class R2Client extends CloudflareBase {
  /**
   * Create bucket in r2
   */
  public async createBucket(config: BucketRequest, cfR2Jurisdiction = "default"): Promise<Bucket> {
    logger.debug(config, "[Cloudflare] Creating r2 bucket");
    try {
      const bucket = await this.makeRequest<Bucket>(
        `/accounts/${this.accountId}/r2/buckets`,
        "POST",
        config,
        {
          "cf-r2-jurisdiction": cfR2Jurisdiction,
        },
      );
      return bucket;
    } catch (e) {
      if (e instanceof CloudflareError) {
        logger.error(e.cause, "[Cloudflare] Failed to create r2 bucket");
      }
      throw e;
    }
  }

  /**
   * Delete bucket in R2
   */
  public async deleteBucket(name: string, cfR2Jurisdiction = "default"): Promise<void> {
    logger.debug({ name }, "[Cloudflare] Deleting r2 bucket");
    try {
      await this.makeRequest(
        `/accounts/${this.accountId}/r2/buckets/${name}`,
        "DELETE",
        {
          headers: {
            "cf-r2-jurisdiction": cfR2Jurisdiction,
          },
        },
      );
    } catch (e) {
      if (e instanceof CloudflareError) {
        logger.error(e.cause, "[Cloudflare] Failed to delete r2 bucket");
      }
      throw e;
    }
  }
}
