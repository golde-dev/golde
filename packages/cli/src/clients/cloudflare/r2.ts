import { logger } from "../../logger.ts";
import type { Region, StorageClass } from "./types.ts";
import { CloudflareBase, CloudflareError } from "./base.ts";

/**
 * @see https://developers.cloudflare.com/api/operations/r2-create-bucket
 */
interface BucketRequest {
  name: string;
  locationHint?: Region;
  storageClass?: StorageClass;
}

interface Bucket {
  creation_date: string;
  location: Region;
  name: string;
  storage_class: StorageClass;
}

export class R2Client extends CloudflareBase {
  /**
   * Create bucket in r2
   */
  public async createBucket(config: BucketRequest): Promise<Bucket> {
    logger.debug("[Cloudflare] Creating r2 bucket", config);
    try {
      const bucket = await this.makeRequest<Bucket>(
        `/accounts/${this.accountId}/r2/buckets`,
        "POST",
        config,
      );
      return bucket;
    } catch (e) {
      if (e instanceof CloudflareError) {
        logger.error("[Cloudflare] Failed to create r2 bucket", e.cause);
      }
      throw e;
    }
  }

  /**
   * Delete bucket in R2
   */
  public async deleteBucket(name: string): Promise<void> {
    logger.debug("[Cloudflare] Deleting r2 bucket", { name });
    try {
      await this.makeRequest(
        `/accounts/${this.accountId}/r2/buckets/${name}`,
        "DELETE",
      );
    } catch (e) {
      if (e instanceof CloudflareError) {
        logger.error("[Cloudflare] Failed to delete r2 bucket", e.cause);
      }
      throw e;
    }
  }
}
