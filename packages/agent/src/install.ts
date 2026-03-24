import {
  daemonReload,
  enable,
  isActive,
  isEnabled,
  restart,
  start,
  write,
} from "@systemd-js/ctl";
import {
  createService,
  createUpdaterService,
  createUpdaterTimer,
} from "./unit.ts";
import {
  AGENT_BIN_DIR,
  AGENT_DIR,
  AGENT_ENV_FILE_PATH,
  AGENT_EXEC_PATH,
  AGENT_UNIT_NAME,
  AGENT_UPDATER_UNIT_NAME,
  AGENT_VERSIONS_DIR,
} from "./constants/name.ts";
import { VERSION } from "./version.ts";
import { logger } from "./logger.ts";
import { join } from "node:path";
import { cpSync, existsSync, mkdirSync, readlinkSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import process from "node:process";

function isLinkChanges(nextTarget: string, linkName: string) {
  if (!existsSync(linkName)) {
    return true;
  }
  const currentTarget = readlinkSync(linkName, "utf-8");
  return currentTarget !== nextTarget;
}

function ensureDirSync(path: string) {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function ensureFileSync(path: string) {
  if (!existsSync(path)) {
    writeFileSync(path, "");
  }
}

export function install() {
  ensureDirSync(AGENT_DIR);
  ensureDirSync(AGENT_VERSIONS_DIR);
  ensureDirSync(AGENT_BIN_DIR);
  ensureFileSync(AGENT_ENV_FILE_PATH);

  const execPath = process.execPath;

  const versionedAgentPath = join(
    AGENT_VERSIONS_DIR,
    `${VERSION}-${AGENT_UNIT_NAME}`,
  );

  if (!existsSync(versionedAgentPath)) {
    logger.info("Copying new agent to version " + VERSION);
    cpSync(execPath, versionedAgentPath, {
      force: true,
    });
  }

  const isServiceVersionChanged = isLinkChanges(
    versionedAgentPath,
    AGENT_EXEC_PATH,
  );
  if (isServiceVersionChanged) {
    logger.info("Symlinking agent to version " + VERSION);
    if(existsSync(AGENT_EXEC_PATH)) {
      unlinkSync(AGENT_EXEC_PATH);
    }
    symlinkSync(versionedAgentPath, AGENT_EXEC_PATH);
  }

  const service = createService();
  const isAgentUnitChanged = write(AGENT_UNIT_NAME, service) !== "unchanged";

  const updater = createUpdaterService();
  const isUpdaterUnitChanged =
    write(AGENT_UPDATER_UNIT_NAME, updater) !== "unchanged";

  const timer = createUpdaterTimer();
  const isTimerUnitChanged =
    write(AGENT_UPDATER_UNIT_NAME, timer) !== "unchanged";

  if (isAgentUnitChanged || isTimerUnitChanged || isUpdaterUnitChanged) {
    logger.info("Reloading systemd daemon configurations");
    daemonReload();
  }

  if (!isEnabled(AGENT_UNIT_NAME, service)) {
    logger.info("Enabling golde-agent service");
    enable(AGENT_UNIT_NAME, service);
  }
  if (!isActive(AGENT_UNIT_NAME, service)) {
    logger.info("Starting golde-agent service");
    start(AGENT_UNIT_NAME, service);
  } else {
    if (isAgentUnitChanged || isServiceVersionChanged) {
      logger.info("Restarting golde-agent service");
      restart(AGENT_UNIT_NAME, service);
    } else {
      logger.info("No changes to golde-agent service");
    }
  }

  if (!isEnabled(AGENT_UPDATER_UNIT_NAME, timer)) {
    logger.info("Enabling golde-agent-updater timer");
    enable(AGENT_UPDATER_UNIT_NAME, timer);
  }
  if (!isActive(AGENT_UPDATER_UNIT_NAME, timer)) {
    logger.info("Starting golde-agent-updater timer");
    start(AGENT_UPDATER_UNIT_NAME, timer);
  } else {
    if (isTimerUnitChanged || isServiceVersionChanged) {
      logger.info("Restarting golde-agent-updater timer");
      restart(AGENT_UPDATER_UNIT_NAME, timer);
    } else {
      logger.info("No changes to golde-agent-updater timer");
    }
  }
}
