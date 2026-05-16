import { isEqual } from "es-toolkit";
import { logger } from "../../../logger.ts";
import { formatDuration } from "../../../utils/duration.ts";
import { nowStringDate } from "../../../utils/date.ts";
import { getIgnoreAlreadyCreated, getIgnoreAlreadyDeleted } from "../../../asyncStorage.ts";
import type { OmitExecutionContext, WithBranch } from "../../../types/config.ts";
import type { HCloudClient } from "../../client/client.ts";
import type { PrimaryNameserver, Zone } from "../../client/zone.ts";
import type { PrimaryNameserverConfig, ZoneConfig, ZoneState } from "./types.ts";

function toApiPrimaryNameservers(
  nss: PrimaryNameserverConfig[] | undefined,
): PrimaryNameserver[] | undefined {
  if (!nss) return undefined;
  return nss.map((ns) => ({
    address: ns.address,
    port: ns.port,
    tsig_algorithm: ns.tsigAlgorithm,
    tsig_key: ns.tsigKey,
  }));
}

function toState(
  zone: Zone,
  config: WithBranch<ZoneConfig>,
  createdAt: string,
  updatedAt: string,
): OmitExecutionContext<ZoneState> {
  return {
    id: zone.id,
    name: zone.name,
    mode: zone.mode,
    ttl: zone.ttl,
    status: zone.status,
    createdAt,
    updatedAt,
    config,
  };
}

async function createZone(
  this: HCloudClient,
  name: string,
  config: WithBranch<ZoneConfig>,
): Promise<OmitExecutionContext<ZoneState>> {
  const start = performance.now();

  if (getIgnoreAlreadyCreated()) {
    const existing = await this.getZoneByName(name);
    if (existing) {
      logger.warn(
        `[Execute][HCloud] zone ${name} already exists (id=${existing.id}), adopting (--ignore-already-created)`,
      );
      const createdAt = existing.created ?? nowStringDate();
      return toState(existing, config, createdAt, createdAt);
    }
  }

  const zone = await this.createZone({
    name,
    mode: config.mode,
    ttl: config.ttl,
    labels: config.labels,
    primary_nameservers: toApiPrimaryNameservers(config.primaryNameservers),
  });

  const end = performance.now();
  logger.debug(
    `[Execute][HCloud] Created zone ${name} (id=${zone.id}) in ${formatDuration(end - start)}`,
  );

  const createdAt = zone.created ?? nowStringDate();
  return toState(zone, config, createdAt, createdAt);
}
export type CreateZone = typeof createZone;

async function updateZone(
  this: HCloudClient,
  name: string,
  config: WithBranch<ZoneConfig>,
  state: ZoneState,
): Promise<OmitExecutionContext<ZoneState>> {
  const start = performance.now();
  const { id } = state;
  const { config: prev } = state;

  if (!isEqual(config.labels ?? {}, prev.labels ?? {})) {
    await this.updateZone(id, { labels: config.labels ?? {} });
    logger.debug(`[Execute][HCloud] Updated labels for zone ${name} (id=${id})`);
  }

  if (config.ttl !== prev.ttl) {
    await this.changeZoneTtl(id, config.ttl ?? null);
    logger.debug(`[Execute][HCloud] Changed TTL for zone ${name} (id=${id})`);
  }

  if (
    config.mode === "secondary" &&
    !isEqual(config.primaryNameservers ?? [], prev.primaryNameservers ?? [])
  ) {
    await this.changeZonePrimaryNameservers(
      id,
      toApiPrimaryNameservers(config.primaryNameservers) ?? [],
    );
    logger.debug(`[Execute][HCloud] Changed primary nameservers for zone ${name} (id=${id})`);
  }

  const refreshed = await this.getZone(id);
  const end = performance.now();
  logger.debug(`[Execute][HCloud] Updated zone ${name} in ${formatDuration(end - start)}`);

  return toState(refreshed, config, state.createdAt, nowStringDate());
}
export type UpdateZone = typeof updateZone;

async function deleteZone(
  this: HCloudClient,
  state: ZoneState,
): Promise<void> {
  const start = performance.now();
  const { id, name } = state;

  if (getIgnoreAlreadyDeleted()) {
    const exists = await this.checkZoneExists(id);
    if (!exists) {
      logger.warn(
        `[Execute][HCloud] zone ${name} (id=${id}) already deleted, skipping (--ignore-already-deleted)`,
      );
      return;
    }
  }

  await this.deleteZone(id);

  const end = performance.now();
  logger.debug(
    `[Execute][HCloud] Deleted zone ${name} (id=${id}) in ${formatDuration(end - start)}`,
  );
}
export type DeleteZone = typeof deleteZone;

export const createZoneExecutors = (client: HCloudClient) => {
  return {
    createZone: createZone.bind(client),
    updateZone: updateZone.bind(client),
    deleteZone: deleteZone.bind(client),
  };
};

export type Executors = ReturnType<typeof createZoneExecutors>;
