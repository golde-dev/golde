import { existsSync } from "@std/fs/exists";
import { create, enable, start, stop } from "@systemd-js/ctl";
import { copySync, ensureDirSync, ensureFileSync } from "@std/fs";
import {
  createService,
  createUpdaterService,
  createUpdaterTimer,
} from "./unit.ts";
import {
  AGENT_DIR,
  AGENT_ENV_FILE_PATH,
  AGENT_EXEC_PATH,
  AGENT_UNIT_NAME,
  AGENT_UPDATER_UNIT_NAME,
} from "./constants/name.ts";

export function install() {
  ensureDirSync(AGENT_DIR);
  ensureFileSync(AGENT_ENV_FILE_PATH);

  const service = createService();
  const execPath = Deno.execPath();

  if (existsSync(AGENT_EXEC_PATH)) {
    stop(AGENT_UNIT_NAME, service);
  }
  copySync(execPath, AGENT_EXEC_PATH, {
    overwrite: true,
  });

  create(AGENT_UNIT_NAME, service);
  enable(AGENT_UNIT_NAME, service);
  start(AGENT_UNIT_NAME, service);

  const updater = createUpdaterService();
  create(AGENT_UPDATER_UNIT_NAME, updater);
  enable(AGENT_UPDATER_UNIT_NAME, updater);

  const timer = createUpdaterTimer();
  create(AGENT_UPDATER_UNIT_NAME, timer);
  enable(AGENT_UPDATER_UNIT_NAME, timer);
}
