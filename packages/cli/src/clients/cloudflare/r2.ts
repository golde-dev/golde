import { logger } from "../../logger.ts";
import type { Region, StorageClass } from "./types.ts";
import { CloudflareBase } from "./base.ts";

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
  public createBucket(config: BucketRequest): Promise<Bucket> {
    logger.debug("Creating r2 bucket", config);
    return this.makeRequest<Bucket>(
      `/accounts/${this.accountId}/r2/buckets`,
      "POST",
      config,
    );
  }

  /**
   * Delete bucket in R2
   */
  public deleteBucket(name: string): Promise<void> {
    logger.debug(name, "Deleting r2 bucket");
    return this.makeRequest(
      `/accounts/${this.accountId}/r2/buckets/${name}`,
      "DELETE",
    );
  }
}
