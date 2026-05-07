import { isEqual } from "es-toolkit";
import { logger } from "../../../logger.ts";
import { formatDuration } from "../../../utils/duration.ts";
import { nowStringDate } from "../../../utils/date.ts";
import { getIgnoreAlreadyDeleted } from "../../../asyncStorage.ts";
import type { OmitExecutionContext, WithBranch } from "../../../types/config.ts";
import type { HCloudClient } from "../../client/client.ts";
import type { ServerConfig, ServerState } from "./types.ts";

interface CreateServerBody {
  automount?: boolean;
  datacenter?: string;
  image: string;
  labels?: Record<string, string>;
  location?: string;
  name: string;
  public_net?: {
    enable_ipv4?: boolean;
    enable_ipv6?: boolean;
  };
  server_type: string;
  ssh_keys?: string[];
  start_after_create?: true;
  user_data?: string;
}

function buildCreateRequest(name: string, config: ServerConfig): CreateServerBody {
  const publicNet = config.enableIpv4 !== undefined || config.enableIpv6 !== undefined
    ? {
      enable_ipv4: config.enableIpv4,
      enable_ipv6: config.enableIpv6,
    }
    : undefined;

  return {
    name,
    image: config.image,
    server_type: config.serverType,
    location: config.location,
    datacenter: config.datacenter,
    ssh_keys: config.sshKeys,
    user_data: config.userData,
    labels: config.labels,
    public_net: publicNet,
  };
}

function toState(
  // deno-lint-ignore no-explicit-any
  server: any,
  config: WithBranch<ServerConfig>,
  createdAt: string,
  updatedAt: string,
): OmitExecutionContext<ServerState> {
  return {
    id: server.id,
    name: server.name,
    ipv4: server.public_net?.ipv4?.ip ?? undefined,
    ipv6: server.public_net?.ipv6?.ip ?? undefined,
    status: server.status,
    datacenter: server.datacenter?.name ?? "",
    location: server.datacenter?.location?.name ?? "",
    createdAt,
    updatedAt,
    config,
  };
}

async function createServer(
  this: HCloudClient,
  name: string,
  config: WithBranch<ServerConfig>,
): Promise<OmitExecutionContext<ServerState>> {
  const start = performance.now();

  const server = await this.createServer(buildCreateRequest(name, config));

  const end = performance.now();
  logger.debug(
    `[Execute][HCloud] Created server ${name} (id=${server.id}) in ${formatDuration(end - start)}`,
  );

  const createdAt = server.created ?? nowStringDate();
  return toState(server, config, createdAt, createdAt);
}
export type CreateServer = typeof createServer;

async function updateServer(
  this: HCloudClient,
  name: string,
  config: WithBranch<ServerConfig>,
  state: ServerState,
): Promise<OmitExecutionContext<ServerState>> {
  const start = performance.now();
  const { id } = state;
  const { config: prev } = state;

  // Labels: PUT /servers/{id}
  if (!isEqual(config.labels ?? {}, prev.labels ?? {})) {
    await this.updateServer(id, { labels: config.labels ?? {} });
    logger.debug(`[Execute][HCloud] Updated labels for server ${name} (id=${id})`);
  }

  // Server type: power off → change_type → power on
  if (config.serverType !== prev.serverType) {
    logger.debug(
      `[Execute][HCloud] Changing server type ${prev.serverType} → ${config.serverType} for ${name} (id=${id})`,
    );
    await this.powerOffServer(id);
    await this.changeServerType(id, config.serverType, false);
    await this.powerOnServer(id);
  }

  const refreshed = await this.getServer(id);
  const end = performance.now();
  logger.debug(`[Execute][HCloud] Updated server ${name} in ${formatDuration(end - start)}`);

  return toState(refreshed, config, state.createdAt, nowStringDate());
}
export type UpdateServer = typeof updateServer;

async function deleteServer(
  this: HCloudClient,
  state: ServerState,
): Promise<void> {
  const start = performance.now();
  const { id, name } = state;

  if (getIgnoreAlreadyDeleted()) {
    const exists = await this.checkServerExists(id);
    if (!exists) {
      logger.warn(
        `[Execute][HCloud] server ${name} (id=${id}) already deleted, skipping (--ignore-already-deleted)`,
      );
      return;
    }
  }

  await this.deleteServer(id);

  const end = performance.now();
  logger.debug(
    `[Execute][HCloud] Deleted server ${name} (id=${id}) in ${formatDuration(end - start)}`,
  );
}
export type DeleteServer = typeof deleteServer;

export const createServerExecutors = (client: HCloudClient) => {
  return {
    createServer: createServer.bind(client),
    updateServer: updateServer.bind(client),
    deleteServer: deleteServer.bind(client),
  };
};

export type Executors = ReturnType<typeof createServerExecutors>;
