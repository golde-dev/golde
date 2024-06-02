import { create, enable, start } from "@systemd-js/ctl";
import { copySync, ensureDirSync, ensureFileSync } from "@std/fs";
import { createDeployerService } from "./unit.ts";
import {
  AGENT_DIR,
  AGENT_ENV_FILE_PATH,
  AGENT_EXEC_PATH,
  AGENT_UNIT_NAME,
} from "./constants/name.ts";

export function install() {
  const service = createDeployerService();

  ensureDirSync(AGENT_DIR);
  ensureFileSync(AGENT_ENV_FILE_PATH);

  const execPath = Deno.execPath();

  copySync(execPath, AGENT_EXEC_PATH, {
    overwrite: true,
  });

  create(AGENT_UNIT_NAME, service);
  enable(AGENT_UNIT_NAME, service);
  start(AGENT_UNIT_NAME, service);
}
