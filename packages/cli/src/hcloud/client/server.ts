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
 * @see https://docs.hetzner.cloud/#locations-get-all-locations
 */
interface Location {
  city: string;
  country: string;
  description: string;
  id: number;
  latitude: number;
  longitude: number;
  name: string;
  network_zone: string;
}

/**
 * @see https://docs.hetzner.cloud/#datacenters-get-a-datacenter
 */
interface Datacenter {
  description: string;
  id: number;
  location: Location;
  name: string;
  server_types: {
    available: number[];
    available_for_migration: number[];
    supported: number[];
  };
}

interface Image {
  architecture: "arm" | "x86";
  bound_to: number | null;
  created: string;
  created_from: {
    id: number;
    name: string;
  } | null;
  deleted: string | null;
  deprecated: string | null;
  description: string;
  disk_size: number;
  id: number;
  image_size: number | null;
  labels: Record<string, string>;
  name: string;
  os_flavor:
    | "alma"
    | "centos"
    | "debian"
    | "fedora"
    | "rocky"
    | "ubuntu"
    | "unknown";
  os_version: string | null;
  protection: {
    delete: boolean;
  };
  rapid_deploy: boolean;
  status: "available" | "creating" | "unavailable";
  type: "app" | "backup" | "snapshot" | "system" | "temporary";
}

interface ServerType {
  architecture: "arm" | "x86";
  cores: number;
  cpu_type: string;
  deprecated: boolean;
  description: string;
  disk: number;
  included_traffic: number;
  memory: number;
  name: string;
  prices: {
    location: string;
    price_hourly: {
      gross: number;
      net: number;
    };
    price_monthly: {
      gross: number;
      net: number;
    };
  }[];
  storage_type: "local" | "network";
}

interface ISO {
  architecture: "arm" | "x86" | null;
  deprecation: {
    announced: string;
    unavailable_after: string;
  } | null;
  description: string;
  id: number;
  name: string | null;
  type: "private" | "public" | null;
}

interface PlacementGroup {
  id: number;
  name: string;
  labels: Record<string, string>;
  servers: number[];
  type: "spread";
}

/**
 * @see https://docs.hetzner.cloud/#servers-create-a-server
 */
interface Server {
  backup_window: string | null;
  created: string;
  datacenter: Datacenter;
  id: number;
  image: Image;
  included_traffic: number | null;
  ingoing_traffic: number | null;
  iso: ISO | null;
  labels: Record<string, string>;
  load_balancers?: number[];
  locked: boolean;
  name: string;
  outgoing_traffic: number | null;
  placement_group: PlacementGroup | null;
  primary_disk_size: number;
  private_net: {
    alias_ips: string[];
    ip: string;
    mac_address: string;
    network: number;
  }[];
  protection: {
    delete: boolean;
    rebuild: false;
  };
  public_net: {
    firewalls: {
      id: number;
      status: "applied" | "pending";
    }[];
    floating_ips: number[];
    ipv4: {
      ip: string;
      blocked: boolean;
      dns_ptr: string | null;
    } | null;
    ipv6: {
      ip: string;
      blocked: boolean;
      dns_ptr: {
        dns_ptr: string;
        ip: string;
      }[] | null;
    } | null;
  };
  rescue_enabled: boolean;
  server_type: ServerType;
  status:
    | "deleting"
    | "initializing"
    | "migrating"
    | "off"
    | "rebuilding"
    | "running"
    | "starting"
    | "stopping"
    | "unknown";
  volumes?: number[];
}

/**
 * Create server request
 * @see https://docs.hetzner.cloud/#servers-create-a-server
 */
interface CreateServerRequest {
  automount?: boolean;
  datacenter?: string;
  firewalls?: {
    firewall: number;
  }[];
  image: string;
  labels?: Record<string, string>;
  location?: string;
  name: string;
  networks?: number[];
  placement_group?: number;
  public_net?: {
    enable_ipv4?: boolean;
    enable_ipv6?: boolean;
    ipv4?: string | null;
    ipv6?: string | null;
  };
  server_type: string;
  ssh_keys?: string[];
  start_after_create?: true;
  user_data?: string;
  volumes?: number[];
}

interface LocationsResponse extends ApiResponse {
  locations: Location[];
}

interface ServersResponse extends ApiResponse {
  servers: Server[];
}

interface ServerResponse extends ApiResponse {
  server: Server;
}

interface CreateServerResponse extends ApiResponse {
  server: Server;
  action: Action;
  next_actions: Action[];
  root_password: string | null;
}

interface DeleteServerResponse extends ApiResponse {
  action: Action;
}

export class ServerClient extends HCloudClientBase {
  public async getLocations(): Promise<Location[]> {
    const errorMessage = `[HCloud] failed to list locations`;
    logger.debug({}, "[HCloud] Listing locations");
    try {
      const { locations, error } = await this.api
        .get("locations", { searchParams: { per_page: "200" } })
        .json<LocationsResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      return locations;
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async listServers(): Promise<Server[]> {
    const errorMessage = `[HCloud] failed to list servers`;
    logger.debug({}, "[HCloud] Listing servers");
    try {
      const { servers, error } = await this.api
        .get("servers", { searchParams: { per_page: "50" } })
        .json<ServersResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      return servers;
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async getServer(id: number): Promise<Server> {
    const errorMessage = `[HCloud] failed to get a server with id ${id}`;
    logger.debug({ id }, "[HCloud] Getting server");
    try {
      const { server, error } = await this.api
        .get(`servers/${id}`)
        .json<ServerResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      return server;
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async checkServerExists(id: number): Promise<boolean> {
    try {
      await this.getServer(id);
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

  public async createServer(config: CreateServerRequest): Promise<Server> {
    const errorMessage = `[HCloud] failed to create a server with a name ${config.name}`;
    logger.debug({ config }, "[HCloud] Creating server");
    try {
      const { action, error, server } = await this.api
        .post("servers", { json: config })
        .json<CreateServerResponse>();
      if (error) {
        throw new HCloudError(errorMessage, error);
      }

      await this.waitForAction(action);

      return await this.getServer(server.id);
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  public async deleteServer(id: number): Promise<void> {
    const errorMessage = `[HCloud] failed to delete a server with id ${id}`;
    logger.debug({ id }, "[HCloud] Deleting server");
    try {
      const { action, error } = await this.api
        .delete(`servers/${id}`)
        .json<DeleteServerResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      await this.waitForAction(action);
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }
}
