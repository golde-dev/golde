import { logger } from "../../logger.ts";
import {
  type ApiResponse,
  getErrorStatus,
  getFetchErrorCause,
  HCloudClientBase,
  HCloudError,
} from "./base.ts";

/**
 * @see https://docs.hetzner.cloud/reference/cloud#tag/ssh-keys
 */
export interface SshKey {
  id: number;
  name: string;
  fingerprint: string;
  public_key: string;
  labels: Record<string, string>;
  created: string;
}

interface SshKeyResponse extends ApiResponse {
  ssh_key: SshKey;
}

interface SshKeysResponse extends ApiResponse {
  ssh_keys: SshKey[];
}

interface CreateSshKeyRequest {
  name: string;
  public_key: string;
  labels?: Record<string, string>;
}

interface UpdateSshKeyRequest {
  name?: string;
  labels?: Record<string, string>;
}

export class SshKeyClient extends HCloudClientBase {
  public async listSshKeys(): Promise<SshKey[]> {
    const errorMessage = `[HCloud] failed to list ssh keys`;
    logger.debug({}, "[HCloud] Listing ssh keys");
    try {
      const { ssh_keys, error } = await this.api
        .get("ssh_keys", { searchParams: { per_page: "50" } })
        .json<SshKeysResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      return ssh_keys;
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async getSshKeyByName(name: string): Promise<SshKey | undefined> {
    const errorMessage = `[HCloud] failed to look up ssh key by name ${name}`;
    logger.debug({ name }, "[HCloud] Looking up ssh key by name");
    try {
      const { ssh_keys, error } = await this.api
        .get("ssh_keys", { searchParams: { name } })
        .json<SshKeysResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      return ssh_keys[0];
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async getSshKey(id: number): Promise<SshKey> {
    const errorMessage = `[HCloud] failed to get ssh key with id ${id}`;
    logger.debug({ id }, "[HCloud] Getting ssh key");
    try {
      const { ssh_key, error } = await this.api
        .get(`ssh_keys/${id}`)
        .json<SshKeyResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      return ssh_key;
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async checkSshKeyExists(id: number): Promise<boolean> {
    try {
      await this.getSshKey(id);
      return true;
    } catch (error) {
      const status = getErrorStatus(error);
      if (status === 404) {
        return false;
      }
      throw error;
    }
  }

  public async createSshKey(body: CreateSshKeyRequest): Promise<SshKey> {
    const errorMessage = `[HCloud] failed to create ssh key ${body.name}`;
    logger.debug({ name: body.name }, "[HCloud] Creating ssh key");
    try {
      const { ssh_key, error } = await this.api
        .post("ssh_keys", { json: body })
        .json<SshKeyResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      return ssh_key;
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  /**
   * @see https://docs.hetzner.cloud/reference/cloud#operation/update_ssh_key
   * Note: only `name` and `labels` are mutable; `public_key` is immutable.
   */
  public async updateSshKey(id: number, body: UpdateSshKeyRequest): Promise<SshKey> {
    const errorMessage = `[HCloud] failed to update ssh key ${id}`;
    logger.debug({ id, body }, "[HCloud] Updating ssh key");
    try {
      const { ssh_key, error } = await this.api
        .put(`ssh_keys/${id}`, { json: body })
        .json<SshKeyResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      return ssh_key;
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async deleteSshKey(id: number): Promise<void> {
    const errorMessage = `[HCloud] failed to delete ssh key ${id}`;
    logger.debug({ id }, "[HCloud] Deleting ssh key");
    try {
      const response = await this.api.delete(`ssh_keys/${id}`);
      if (!response.ok) {
        throw new HCloudError(errorMessage);
      }
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }
}
