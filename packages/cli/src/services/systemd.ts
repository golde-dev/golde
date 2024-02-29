
import type { HostDeployApps } from "./caddy.js";
import { systemNodeApi } from "./nodeApi.js";



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

