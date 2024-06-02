import { Service } from "@systemd-js/conf";
import { AGENT_ENV_FILE_PATH, AGENT_EXEC_PATH } from "./constants/name.ts";

export const createDeployerService = () => {
  const service = new Service();

  service
    .getUnitSection()
    .setAfter("network.target")
    .setDescription("Deployer Agent");

  service
    .getInstallSection()
    .setWantedBy("multi-user.target");

  service
    .getServiceSection()
    .setRestart("always")
    .setUser("root")
    .setGroup("root")
    .setEnvironmentFile(AGENT_ENV_FILE_PATH)
    .setExecStart(`${AGENT_EXEC_PATH} start`);

  return service;
};
