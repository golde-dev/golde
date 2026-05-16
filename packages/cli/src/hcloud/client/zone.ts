import { logger } from "../../logger.ts";
import {
  type Action,
  type ApiResponse,
  getErrorStatus,
  getFetchErrorCause,
  HCloudClientBase,
  HCloudError,
} from "./base.ts";

/**
 * @see https://docs.hetzner.cloud/reference/cloud#tag/zones
 */
export interface PrimaryNameserver {
  address: string;
  port?: number;
  tsig_algorithm?: string | null;
  tsig_key?: string | null;
}

export interface Zone {
  id: number;
  name: string;
  mode: "primary" | "secondary";
  ttl: number;
  status: string;
  registrar?: string | null;
  authoritative_nameservers?: {
    assigned: string[];
    delegated: string[];
    delegation_last_check: string | null;
    delegation_status: string;
  };
  primary_nameservers?: PrimaryNameserver[];
  protection: { delete: boolean };
  labels: Record<string, string>;
  created: string;
}

interface ZoneResponse extends ApiResponse {
  zone: Zone;
}

interface ZonesResponse extends ApiResponse {
  zones: Zone[];
}

interface CreateZoneResponse extends ApiResponse {
  zone: Zone;
  action: Action;
}

interface ActionsResponse extends ApiResponse {
  action: Action;
}

interface CreateZoneRequest {
  name: string;
  mode: "primary" | "secondary";
  ttl?: number;
  labels?: Record<string, string>;
  primary_nameservers?: PrimaryNameserver[];
}

interface UpdateZoneRequest {
  labels?: Record<string, string>;
}

export class ZoneClient extends HCloudClientBase {
  public async listZones(): Promise<Zone[]> {
    const errorMessage = `[HCloud] failed to list zones`;
    logger.debug({}, "[HCloud] Listing zones");
    try {
      const { zones, error } = await this.api
        .get("zones", { searchParams: { per_page: "50" } })
        .json<ZonesResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      return zones;
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async getZoneByName(name: string): Promise<Zone | undefined> {
    const errorMessage = `[HCloud] failed to look up zone by name ${name}`;
    logger.debug({ name }, "[HCloud] Looking up zone by name");
    try {
      const { zones, error } = await this.api
        .get("zones", { searchParams: { name } })
        .json<ZonesResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      return zones[0];
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async getZone(idOrName: string | number): Promise<Zone> {
    const errorMessage = `[HCloud] failed to get zone ${idOrName}`;
    logger.debug({ idOrName }, "[HCloud] Getting zone");
    try {
      const { zone, error } = await this.api
        .get(`zones/${encodeURIComponent(String(idOrName))}`)
        .json<ZoneResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      return zone;
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async checkZoneExists(idOrName: string | number): Promise<boolean> {
    try {
      await this.getZone(idOrName);
      return true;
    } catch (error) {
      const status = getErrorStatus(error);
      if (status === 404) {
        return false;
      }
      throw error;
    }
  }

  public async createZone(body: CreateZoneRequest): Promise<Zone> {
    const errorMessage = `[HCloud] failed to create zone ${body.name}`;
    logger.debug({ name: body.name }, "[HCloud] Creating zone");
    try {
      const { zone, action, error } = await this.api
        .post("zones", { json: body })
        .json<CreateZoneResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      await this.waitForAction(action);
      return await this.getZone(zone.id);
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  /**
   * PUT /zones/{id_or_name} — only `labels` are mutable here. Synchronous,
   * no Action returned.
   */
  public async updateZone(idOrName: string | number, body: UpdateZoneRequest): Promise<Zone> {
    const errorMessage = `[HCloud] failed to update zone ${idOrName}`;
    logger.debug({ idOrName, body }, "[HCloud] Updating zone");
    try {
      const { zone, error } = await this.api
        .put(`zones/${encodeURIComponent(String(idOrName))}`, { json: body })
        .json<ZoneResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      return zone;
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async changeZoneTtl(idOrName: string | number, ttl: number | null): Promise<Action> {
    const errorMessage = `[HCloud] failed to change zone ${idOrName} ttl`;
    logger.debug({ idOrName, ttl }, "[HCloud] Changing zone TTL");
    try {
      const { action, error } = await this.api
        .post(`zones/${encodeURIComponent(String(idOrName))}/actions/change_ttl`, {
          json: { ttl },
        })
        .json<ActionsResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      return await this.waitForAction(action);
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async changeZonePrimaryNameservers(
    idOrName: string | number,
    primaryNameservers: PrimaryNameserver[],
  ): Promise<Action> {
    const errorMessage = `[HCloud] failed to change zone ${idOrName} primary nameservers`;
    logger.debug({ idOrName, primaryNameservers }, "[HCloud] Changing zone primary nameservers");
    try {
      const { action, error } = await this.api
        .post(`zones/${encodeURIComponent(String(idOrName))}/actions/change_primary_nameservers`, {
          json: { primary_nameservers: primaryNameservers },
        })
        .json<ActionsResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      return await this.waitForAction(action);
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async deleteZone(idOrName: string | number): Promise<void> {
    const errorMessage = `[HCloud] failed to delete zone ${idOrName}`;
    logger.debug({ idOrName }, "[HCloud] Deleting zone");
    try {
      const { action, error } = await this.api
        .delete(`zones/${encodeURIComponent(String(idOrName))}`)
        .json<ActionsResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      await this.waitForAction(action);
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }
}
