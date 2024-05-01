import type { HostDeployApps } from "./caddy.ts";
import { systemNodeApi } from "./nodeApi.ts";

export function translate(config: HostDeployApps) {
  Object.entries(config).forEach(([app, appConf]) => {
    const {
      reverseProxy = {},
    } = appConf;

    Object.entries(reverseProxy).forEach(([api, proxyConfig]) => {
      if (proxyConfig.systemdTemplate === "node-api") {
        systemNodeApi(app, api, proxyConfig);
      }
    });
  });
}
