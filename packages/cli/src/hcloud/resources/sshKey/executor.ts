import { isEqual } from "es-toolkit";
import { logger } from "../../../logger.ts";
import { formatDuration } from "../../../utils/duration.ts";
import { nowStringDate } from "../../../utils/date.ts";
import { getIgnoreAlreadyCreated, getIgnoreAlreadyDeleted } from "../../../asyncStorage.ts";
import type { OmitExecutionContext, WithBranch } from "../../../types/config.ts";
import type { HCloudClient } from "../../client/client.ts";
import type { SshKey } from "../../client/sshKey.ts";
import type { SSHKeyConfig, SSHKeyState } from "./types.ts";

function toState(
  sshKey: SshKey,
  config: WithBranch<SSHKeyConfig>,
  createdAt: string,
  updatedAt: string,
): OmitExecutionContext<SSHKeyState> {
  return {
    id: sshKey.id,
    name: sshKey.name,
    fingerprint: sshKey.fingerprint,
    publicKey: sshKey.public_key,
    createdAt,
    updatedAt,
    config,
  };
}

async function createSshKey(
  this: HCloudClient,
  name: string,
  config: WithBranch<SSHKeyConfig>,
): Promise<OmitExecutionContext<SSHKeyState>> {
  const start = performance.now();

  if (getIgnoreAlreadyCreated()) {
    const existing = await this.getSshKeyByName(name);
    if (existing) {
      logger.warn(
        `[Execute][HCloud] ssh key ${name} already exists (id=${existing.id}), adopting (--ignore-already-created)`,
      );
      const createdAt = existing.created ?? nowStringDate();
      return toState(existing, config, createdAt, createdAt);
    }
  }

  const sshKey = await this.createSshKey({
    name,
    public_key: config.publicKey,
    labels: config.labels,
  });

  const end = performance.now();
  logger.debug(
    `[Execute][HCloud] Created ssh key ${name} (id=${sshKey.id}) in ${formatDuration(end - start)}`,
  );

  const createdAt = sshKey.created ?? nowStringDate();
  return toState(sshKey, config, createdAt, createdAt);
}
export type CreateSshKey = typeof createSshKey;

async function updateSshKey(
  this: HCloudClient,
  name: string,
  config: WithBranch<SSHKeyConfig>,
  state: SSHKeyState,
): Promise<OmitExecutionContext<SSHKeyState>> {
  const start = performance.now();
  const { id } = state;
  const { config: prev } = state;

  if (!isEqual(config.labels ?? {}, prev.labels ?? {})) {
    await this.updateSshKey(id, { labels: config.labels ?? {} });
    logger.debug(`[Execute][HCloud] Updated labels for ssh key ${name} (id=${id})`);
  }

  const refreshed = await this.getSshKey(id);
  const end = performance.now();
  logger.debug(
    `[Execute][HCloud] Updated ssh key ${name} in ${formatDuration(end - start)}`,
  );

  return toState(refreshed, config, state.createdAt, nowStringDate());
}
export type UpdateSshKey = typeof updateSshKey;

async function deleteSshKey(
  this: HCloudClient,
  state: SSHKeyState,
): Promise<void> {
  const start = performance.now();
  const { id, name } = state;

  if (getIgnoreAlreadyDeleted()) {
    const exists = await this.checkSshKeyExists(id);
    if (!exists) {
      logger.warn(
        `[Execute][HCloud] ssh key ${name} (id=${id}) already deleted, skipping (--ignore-already-deleted)`,
      );
      return;
    }
  }

  await this.deleteSshKey(id);

  const end = performance.now();
  logger.debug(
    `[Execute][HCloud] Deleted ssh key ${name} (id=${id}) in ${formatDuration(end - start)}`,
  );
}
export type DeleteSshKey = typeof deleteSshKey;

export const createSshKeyExecutors = (client: HCloudClient) => {
  return {
    createSshKey: createSshKey.bind(client),
    updateSshKey: updateSshKey.bind(client),
    deleteSshKey: deleteSshKey.bind(client),
  };
};

export type Executors = ReturnType<typeof createSshKeyExecutors>;
