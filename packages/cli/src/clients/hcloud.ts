import { logger } from "../logger.ts";
import { stringify } from "node:querystring";

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

interface ResultBase {
  error?: {
    code: string;
    message: string;
    details: ErrorDetails;
  };
  meta?: object;
}

interface LocationsResponse extends ResultBase {
  locations: Location;
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

interface CreateServerResponse extends ResultBase {
  server: Server;
}

interface ErrorDetails {
  code: string;
  message: string;
  details: ErrorDetails;
}

interface ErrorCause {
  code: string;
  message: string;
  details: ErrorDetails;
}

interface FetchErrorCause {
  status: number;
  statusText: string;
}

export class HCloudError extends Error {
  public constructor(message: string, cause: ErrorCause | FetchErrorCause) {
    super(message, { cause });
  }
}

export class HCloudClient {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.hetzner.cloud/v1";

  public constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private makeRequest<T extends ResultBase>(
    path: string,
    method = "GET",
    body?: BodyInit,
  ): Promise<Omit<T, "error" | "meta">> {
    const start = Date.now();
    return fetch(`${this.baseUrl}/${path}`, {
      body,
      method,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    }).then(async (d) => {
      if (!d.ok) {
        throw new HCloudError("Request failed", {
          status: d.status,
          statusText: d.statusText,
        });
      }
      const { error, meta: _, ...rest } = await d.json() as T;
      if (error) {
        throw new HCloudError("Request failed", error);
      }
      return rest;
    }).finally(() => {
      const end = Date.now();
      logger.debug("Completed hetzner request", {
        path,
        method,
        body,
        time: end - start,
      });
    });
  }

  public async verifyUserToken(): Promise<void> {
    await this.getLocations();
  }

  public getLocations() {
    const query = stringify({
      per_page: 200,
    });
    return this.makeRequest<LocationsResponse>(
      `/locations?${query}`,
    );
  }

  public createServer(config: CreateServerRequest) {
    return this.makeRequest<CreateServerResponse>(
      "/servers",
      "POST",
      JSON.stringify(config),
    );
  }
}
