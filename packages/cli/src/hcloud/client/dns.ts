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
 * @see https://docs.hetzner.cloud/reference/cloud#tag/zone-rrsets
 */
export type RRSetType =
  | "A"
  | "AAAA"
  | "CAA"
  | "CNAME"
  | "DS"
  | "HINFO"
  | "HTTPS"
  | "MX"
  | "NS"
  | "PTR"
  | "RP"
  | "SOA"
  | "SRV"
  | "SVCB"
  | "TLSA"
  | "TXT";

export interface RRSetRecord {
  value: string;
  comment?: string;
}

export interface RRSet {
  id: string; // "name/type"
  name: string;
  type: RRSetType;
  ttl: number | null;
  records: RRSetRecord[];
  labels: Record<string, string>;
  protection: { change: boolean };
}

interface RRSetResponse extends ApiResponse {
  rrset: RRSet;
}

interface RRSetsResponse extends ApiResponse {
  rrsets: RRSet[];
}

interface CreateRRSetResponse extends ApiResponse {
  rrset: RRSet;
  action: Action;
}

interface ActionsResponse extends ApiResponse {
  action: Action;
}

interface CreateRRSetRequest {
  name: string;
  type: RRSetType;
  ttl?: number | null;
  records: RRSetRecord[];
  labels?: Record<string, string>;
}

interface UpdateRRSetRequest {
  labels?: Record<string, string>;
}

function rrsetPath(zone: string | number, name: string, type: RRSetType): string {
  return `zones/${encodeURIComponent(String(zone))}/rrsets/${encodeURIComponent(name)}/${type}`;
}

export class DnsClient extends HCloudClientBase {
  public async listRrsets(zone: string | number): Promise<RRSet[]> {
    const errorMessage = `[HCloud] failed to list rrsets for zone ${zone}`;
    logger.debug({ zone }, "[HCloud] Listing rrsets");
    try {
      const { rrsets, error } = await this.api
        .get(`zones/${encodeURIComponent(String(zone))}/rrsets`, {
          searchParams: { per_page: "50" },
        })
        .json<RRSetsResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      return rrsets;
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async getRrset(
    zone: string | number,
    name: string,
    type: RRSetType,
  ): Promise<RRSet> {
    const errorMessage = `[HCloud] failed to get rrset ${name}/${type} in zone ${zone}`;
    logger.debug({ zone, name, type }, "[HCloud] Getting rrset");
    try {
      const { rrset, error } = await this.api
        .get(rrsetPath(zone, name, type))
        .json<RRSetResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      return rrset;
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async checkRrsetExists(
    zone: string | number,
    name: string,
    type: RRSetType,
  ): Promise<boolean> {
    try {
      await this.getRrset(zone, name, type);
      return true;
    } catch (error) {
      const status = getErrorStatus(error);
      if (status === 404) {
        return false;
      }
      throw error;
    }
  }

  public async createRrset(zone: string | number, body: CreateRRSetRequest): Promise<RRSet> {
    const errorMessage = `[HCloud] failed to create rrset ${body.name}/${body.type} in zone ${zone}`;
    logger.debug({ zone, body }, "[HCloud] Creating rrset");
    try {
      const { action, error } = await this.api
        .post(`zones/${encodeURIComponent(String(zone))}/rrsets`, { json: body })
        .json<CreateRRSetResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      await this.waitForAction(action);
      return await this.getRrset(zone, body.name, body.type);
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  /**
   * PUT /zones/.../rrsets/{name}/{type} — only `labels` are mutable.
   * Synchronous, no Action returned.
   */
  public async updateRrsetLabels(
    zone: string | number,
    name: string,
    type: RRSetType,
    body: UpdateRRSetRequest,
  ): Promise<RRSet> {
    const errorMessage = `[HCloud] failed to update labels for rrset ${name}/${type} in zone ${zone}`;
    logger.debug({ zone, name, type, body }, "[HCloud] Updating rrset labels");
    try {
      const { rrset, error } = await this.api
        .put(rrsetPath(zone, name, type), { json: body })
        .json<RRSetResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      return rrset;
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async changeRrsetTtl(
    zone: string | number,
    name: string,
    type: RRSetType,
    ttl: number | null,
  ): Promise<Action> {
    const errorMessage = `[HCloud] failed to change ttl for rrset ${name}/${type} in zone ${zone}`;
    logger.debug({ zone, name, type, ttl }, "[HCloud] Changing rrset TTL");
    try {
      const { action, error } = await this.api
        .post(`${rrsetPath(zone, name, type)}/actions/change_ttl`, { json: { ttl } })
        .json<ActionsResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      return await this.waitForAction(action);
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async setRrsetRecords(
    zone: string | number,
    name: string,
    type: RRSetType,
    records: RRSetRecord[],
  ): Promise<Action> {
    const errorMessage = `[HCloud] failed to set records for rrset ${name}/${type} in zone ${zone}`;
    logger.debug({ zone, name, type, records }, "[HCloud] Setting rrset records");
    try {
      const { action, error } = await this.api
        .post(`${rrsetPath(zone, name, type)}/actions/set_records`, { json: { records } })
        .json<ActionsResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      return await this.waitForAction(action);
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async deleteRrset(
    zone: string | number,
    name: string,
    type: RRSetType,
  ): Promise<void> {
    const errorMessage = `[HCloud] failed to delete rrset ${name}/${type} in zone ${zone}`;
    logger.debug({ zone, name, type }, "[HCloud] Deleting rrset");
    try {
      const { action, error } = await this.api
        .delete(rrsetPath(zone, name, type))
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
