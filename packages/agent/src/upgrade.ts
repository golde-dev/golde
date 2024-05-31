import { create, enable, reload, restart } from "@systemd-js/ctl";
import { createDeployerService } from "./unit.ts";

export function upgrade() {
  const service = createDeployerService();

  create("deployer-agent", service);
  enable("deployer-agent", service);
  reload("deployer-agent", service);
  restart("deployer-agent", service);
}
