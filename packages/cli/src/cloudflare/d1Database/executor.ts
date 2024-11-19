import { PlanError, PlanErrorCode } from "../../error.ts";
import { logger } from "../../logger.ts";
import type { WithBranch } from "../../types/config.ts";
import { formatDuration } from "../../utils/duration.ts";
import type { CloudflareClient } from "../client/client.ts";
import type { DatabaseConfig, DatabaseState } from "./types.ts";

export async function createDatabase(
  this: CloudflareClient,
  name: string,
  config: WithBranch<DatabaseConfig>,
): Promise<DatabaseState> {
  const {
    locationHint,
  } = config;
  const start = Date.now();

  const { uuid, created_on: createdAt } = await this.createD1Database({
    name: name,
    locationHint: locationHint,
  });

  const end = Date.now();
  logger.debug(`[Cloudflare] Created D1 database ${name} in ${formatDuration(end - start)}`);

  return {
    uuid,
    createdAt,
    config,
  };
}
export type CreateDatabase = typeof createDatabase;

export async function deleteDatabase(
  this: CloudflareClient,
  name: string,
): Promise<void> {
  const start = Date.now();
  await this.deleteD1Database(name);
  const end = Date.now();
  logger.debug(`[Cloudflare] Deleted D1 database ${name} in ${formatDuration(end - start)}`);
}

export type DeleteDatabase = typeof deleteDatabase;

export async function assertDatabaseExist(this: CloudflareClient, name: string) {
  const start = performance.now();
  const exists = await this.checkD1DatabaseExists(name);
  const end = performance.now();
  logger.debug(`[Cloudflare] Checked D1 database ${name} exists in ${formatDuration(end - start)}`);
  if (!exists) {
    throw new PlanError(`D1 database ${name} does not exist`, PlanErrorCode.RESOURCE_NOT_FOUND);
  }
}

export async function assertDatabaseNotExist(
  this: CloudflareClient,
  name: string,
) {
  const start = performance.now();
  const exists = await this.checkD1DatabaseExists(name);
  const end = performance.now();
  logger.debug(
    `[Cloudflare] Checked D1 database ${name} not exists in ${formatDuration(end - start)}`,
  );
  if (exists) {
    throw new PlanError(`D1 Database ${name} already exists`, PlanErrorCode.RESOURCE_EXISTS);
  }
}

export const createD1DatabaseExecutors = (cf: CloudflareClient) => {
  return {
    createDatabase: createDatabase.bind(cf),
    deleteDatabase: deleteDatabase.bind(cf),
    assertDatabaseExist: assertDatabaseExist.bind(cf),
    assertDatabaseNotExist: assertDatabaseNotExist.bind(cf),
  };
};

export type Executors = ReturnType<typeof createD1DatabaseExecutors>;
