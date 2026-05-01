import { logger } from "../../logger.ts";
import {
  type ApiResponse,
  CloudflareBase,
  CloudflareError,
  getErrorStatus,
  getFetchErrorCause,
} from "./base.ts";
import type { Region, StorageClass } from "./types.ts";

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
    const errorMessage = `Cloudflare failed to create a bucket with a name ${config.name}`;
    logger.debug(config, "[Cloudflare] Creating r2 bucket");
    try {
      const { result, success, errors } = await this.api
        .post(`accounts/${this.accountId}/r2/buckets`, {
          json: config,
          headers: { "cf-r2-jurisdiction": cfR2Jurisdiction },
        })
        .json<ApiResponse<Bucket>>();

      if (!success) {
        throw new CloudflareError(errorMessage, errors);
      }
      return result;
    } catch (error) {
      throw new CloudflareError(errorMessage, getFetchErrorCause(error));
    }
  }

  /**
   * Get a single R2 bucket by name, or null if it does not exist
   */
  public async getBucket(name: string, cfR2Jurisdiction = "default"): Promise<Bucket | null> {
    logger.debug({ name }, "[Cloudflare] Getting r2 bucket");
    const errorMessage = `Cloudflare failed to get a bucket with a name ${name}`;
    try {
      const { result, success, errors } = await this.api
        .get(`accounts/${this.accountId}/r2/buckets/${name}`, {
          headers: { "cf-r2-jurisdiction": cfR2Jurisdiction },
        })
        .json<ApiResponse<Bucket>>();

      if (!success) {
        throw new CloudflareError(errorMessage, errors);
      }
      return result;
    } catch (error) {
      throw new CloudflareError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async checkBucketExists(
    name: string,
    cfR2Jurisdiction = "default",
  ): Promise<boolean> {
    try {
      await this.getBucket(name, cfR2Jurisdiction);
      return true;
    } catch (error) {
      const status = getErrorStatus(error);
      if (status === 404) {
        return false;
      } else {
        throw error;
      }
    }
  }

  /**
   * Delete bucket in R2
   */
  public async deleteBucket(name: string, cfR2Jurisdiction = "default"): Promise<void> {
    const errorMessage = `Cloudflare failed to delete a bucket with a name ${name}`;
    logger.debug({ name }, "[Cloudflare] Deleting r2 bucket");
    try {
      const { success, errors } = await this.api
        .delete(`accounts/${this.accountId}/r2/buckets/${name}`, {
          headers: { "cf-r2-jurisdiction": cfR2Jurisdiction },
        })
        .json<ApiResponse<unknown>>();

      if (!success) {
        throw new CloudflareError(errorMessage, errors);
      }
    } catch (error) {
      throw new CloudflareError(errorMessage, getFetchErrorCause(error));
    }
  }
}
