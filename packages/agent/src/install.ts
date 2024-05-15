import { Service } from "@systemd-js/conf";

export function install() {
  const service = new Service();

  service
    .getServiceSection()
    .setExecStart("/usr/bin/node /path/to/your/app.js");
}
