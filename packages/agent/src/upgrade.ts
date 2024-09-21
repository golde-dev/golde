import { enable, reload, restart, write } from "@systemd-js/ctl";
import {
  createService,
  createUpdaterService,
  createUpdaterTimer,
} from "./unit.ts";
import {
  AGENT_EXEC_PATH,
  AGENT_UNIT_NAME,
  AGENT_UPDATER_UNIT_NAME,
} from "./constants/name.ts";
import { copySync } from "@std/fs";

export function upgrade() {
  const execPath = Deno.execPath();
  copySync(execPath, AGENT_EXEC_PATH, {
    overwrite: true,
  });

  const updater = createUpdaterService();
  write(AGENT_UPDATER_UNIT_NAME, updater);
  enable(AGENT_UPDATER_UNIT_NAME, updater);
  reload(AGENT_UPDATER_UNIT_NAME, updater);
  restart(AGENT_UPDATER_UNIT_NAME, updater);

  const timer = createUpdaterTimer();
  write(AGENT_UPDATER_UNIT_NAME, timer);
  enable(AGENT_UPDATER_UNIT_NAME, timer);
  reload(AGENT_UPDATER_UNIT_NAME, timer);

  const service = createService();
  write(AGENT_UNIT_NAME, service);
  enable(AGENT_UNIT_NAME, service);
  reload(AGENT_UNIT_NAME, service);
}
