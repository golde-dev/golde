import { PlanError, PlanErrorCode } from "../../../../error.ts";
import { logger } from "../../../../logger.ts";
import type { OmitExecutionContext, WithBranch } from "../../../../types/config.ts";
import { formatDuration } from "../../../../utils/duration.ts";
import { getIgnoreAlreadyCreated, getIgnoreAlreadyDeleted } from "../../../../asyncStorage.ts";
import type { CloudflareClient } from "../../../client/client.ts";
import type { DatabaseConfig, DatabaseState } from "./types.ts";

export async function createDatabase(
  this: CloudflareClient,
  name: string,
  config: WithBranch<DatabaseConfig>,
): Promise<OmitExecutionContext<DatabaseState>> {
  const {
    locationHint,
  } = config;

  if (getIgnoreAlreadyCreated()) {
    const existing = await this.getD1Database(name);
    if (existing) {
      logger.warn(
        `[Execute][Cloudflare] D1 database ${name} already exists, skipping create (--ignore-already-created)`,
      );
      return {
        uuid: existing.uuid,
        createdAt: existing.created_on,
        config,
      };
    }
  }

  const start = Date.now();

  const { uuid, created_on: createdAt } = await this.createD1Database({
    name: name,
    locationHint: locationHint,
  });

  const end = Date.now();
  logger.debug(
    `[Execute][Cloudflare] Created D1 database ${name} in ${formatDuration(end - start)}`,
  );

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
  if (getIgnoreAlreadyDeleted()) {
    const exists = await this.checkD1DatabaseExists(name);
    if (!exists) {
      logger.warn(
        `[Execute][Cloudflare] D1 database ${name} already deleted, skipping (--ignore-already-deleted)`,
      );
      return;
    }
  }

  const start = Date.now();
  await this.deleteD1Database(name);
  const end = Date.now();
  logger.debug(
    `[Execute][Cloudflare] Deleted D1 database ${name} in ${formatDuration(end - start)}`,
  );
}

export type DeleteDatabase = typeof deleteDatabase;

export async function assertDatabaseExist(this: CloudflareClient, name: string) {
  const start = performance.now();
  const exists = await this.checkD1DatabaseExists(name);
  const end = performance.now();
  logger.debug(
    `[Plan][Cloudflare] Checked D1 database ${name} exists in ${formatDuration(end - start)}`,
  );
  if (!exists) {
    if (getIgnoreAlreadyDeleted()) {
      logger.warn(
        `[Plan][Cloudflare] D1 database ${name} does not exist, skipping assertion (--ignore-already-deleted)`,
      );
      return;
    }
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
    `[Plan][Cloudflare] Checked D1 database ${name} not exists in ${formatDuration(end - start)}`,
  );
  if (exists) {
    if (getIgnoreAlreadyCreated()) {
      logger.warn(
        `[Plan][Cloudflare] D1 database ${name} already exists, skipping assertion (--ignore-already-created)`,
      );
      return;
    }
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
