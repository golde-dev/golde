import { create, enable, reload, restart } from "@systemd-js/ctl";
import { createDeployerService } from "./unit.ts";
import { AGENT_EXEC_PATH, AGENT_UNIT_NAME } from "./constants/name.ts";
import { copySync } from "@std/fs";

export function upgrade() {
  const service = createDeployerService();

  const execPath = Deno.execPath();
  copySync(execPath, AGENT_EXEC_PATH, {
    overwrite: true,
  });

  create(AGENT_UNIT_NAME, service);
  enable(AGENT_UNIT_NAME, service);
  reload(AGENT_UNIT_NAME, service);
  restart(AGENT_UNIT_NAME, service);
}
