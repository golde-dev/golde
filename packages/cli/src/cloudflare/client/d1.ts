import { logger } from "../../logger.ts";
import {
  type ApiResponse,
  CloudflareBase,
  CloudflareError,
  getErrorStatus,
  getFetchErrorCause,
} from "./base.ts";
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
  public async createD1Database(config: D1DatabaseRequest): Promise<D1Database> {
    const errorMessage = `[Cloudflare] failed to create a database with a name ${config.name}`;
    logger.debug({ config }, "[Cloudflare] Creating d1 database");
    try {
      const { result, success, errors } = await this.api
        .post(`accounts/${this.accountId}/d1/database`, { json: config })
        .json<ApiResponse<D1Database>>();

      if (!success) {
        throw new CloudflareError(errorMessage, errors);
      }
      return result;
    } catch (error) {
      throw new CloudflareError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async deleteD1Database(name: string): Promise<void> {
    const errorMessage = `[Cloudflare] failed to delete a database with a name ${name}`;
    logger.debug({ name }, "[Cloudflare] Deleting D1 database");
    try {
      const { success, errors } = await this.api
        .delete(`accounts/${this.accountId}/d1/database/${name}`)
        .json<ApiResponse<unknown>>();

      if (!success) {
        throw new CloudflareError(errorMessage, errors);
      }
    } catch (error) {
      throw new CloudflareError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async getD1Database(name: string): Promise<D1Database | null> {
    const errorMessage = `[Cloudflare] failed to get a database with a name ${name}`;
    logger.debug({ name }, "[Cloudflare] Getting D1 database");
    try {
      const { result, success, errors } = await this.api
        .get(`accounts/${this.accountId}/d1/database/${name}`)
        .json<ApiResponse<D1Database>>();

         if (!success) {
          throw new CloudflareError(errorMessage, errors);
         }

        return result;
    } catch (error)  {
      throw new CloudflareError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async checkD1DatabaseExists(name: string): Promise<boolean> {
    try {
      await this.getD1Database(name)
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
}
