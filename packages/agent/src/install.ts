import { create, enable, start } from "@systemd-js/ctl";
import { createDeployerService } from "./unit.ts";

export function install() {
  const service = createDeployerService();

  create("deployer-agent", service);
  enable("deployer-agent", service);
  start("deployer-agent", service);
}
