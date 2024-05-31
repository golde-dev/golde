import { Service } from "@systemd-js/conf";

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
    .setEnvironmentFile("/opt/deployer/agent/.env")
    .setExecStart("/opt/deployer/agent/current start");

  return service;
};
