
import { systemNodeApi } from "./nodeApi.js";
import type { HostDeployApps } from "../types/config.js";


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

