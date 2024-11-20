import { logger } from "../../logger.ts";
import { CloudflareError } from "./base.ts";
import { CloudflareBase } from "./base.ts";
import type { Region } from "./types.ts";

/**
 * @see https://developers.cloudflare.com/api/operations/cloudflare-d1-create-database
 */
interface D1DatabaseRequest {
  name: string;
  locationHint?: Region;
}

interface D1Database {
  uuid: string;
  name: string;
  file_size: number;
  created_on: string;
  num_tables: number;
  version: string;
}

export class D1Client extends CloudflareBase {
  public async createD1Database(config: D1DatabaseRequest) {
    logger.debug("[Cloudflare] Creating d1 database", { config });
    try {
      const bucket = await this.makeRequest<D1Database>(
        `accounts/${this.accountId}}/d1/database`,
        "POST",
        config,
      );
      return bucket;
    } catch (e) {
      if (e instanceof CloudflareError) {
        logger.error("[Cloudflare] Failed to create d1 database", e.cause);
      }
      throw e;
    }
  }

  public async deleteD1Database(name: string) {
    logger.debug("[Cloudflare] Deleting D1 database", { name });
    try {
      await this.makeRequest(
        `/accounts/${this.accountId}/d1/database/${name}`,
        "DELETE",
      );
    } catch (e) {
      if (e instanceof CloudflareError) {
        logger.error("[Cloudflare] Failed to delete D1 database", e.cause);
      }
      throw e;
    }
  }

  public async checkD1DatabaseExists(name: string): Promise<boolean> {
    logger.debug("[Cloudflare] Deleting D1 database", { name });
    try {
      await this.makeRequest(
        `/accounts/${this.accountId}/d1/database/${name}`,
        "GET",
      );
      return true;
    } catch {
      return false;
    }
  }
}
