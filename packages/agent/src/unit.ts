import { Service, Timer } from "@systemd-js/conf";
import { AGENT_ENV_FILE_PATH, AGENT_EXEC_PATH } from "./constants/name.ts";

export const createService = () => {
  const service = new Service();

  service
    .getUnitSection()
    .setAfter("network.target")
    .setDescription("Golde infrastructure agent");

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

export const createUpdaterTimer = () => {
  const timer = new Timer();

  timer
    .getUnitSection()
    .setDescription("Golde infrastructure agent updater timer");

  timer
    .getInstallSection()
    .setWantedBy("timers.target");

  timer
    .getTimerSection()
    .setOnBootSec("1m")
    .setOnUnitActiveSec("1h");

  return timer;
};

export const createUpdaterService = () => {
  const service = new Service();

  service
    .getUnitSection()
    .setDescription("Golde infrastructure agent updater");

  service
    .getInstallSection()
    .setWantedBy("multi-user.target");

  service
    .getServiceSection()
    .setType("oneshot")
    .setUser("root")
    .setGroup("root")
    .setExecStart(`${AGENT_EXEC_PATH} upgrade`);

  return service;
};
