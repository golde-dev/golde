import { writeFileSync } from "fs";
import { join } from "path";
import type { ReverseProxyApp } from "./caddy";


export const systemNodeApi = (
  app: string, 
  api: string, 
  config: ReverseProxyApp
) => {
  const {
    greenPorts, 
    bluePorts,
    root,
  } = config;

  const apiRuntime = `dx-${app}-${api}`;

  const templateWorker = `
[Unit]
Description="${apiRuntime}-#%i"
After=network.target

[Install]
WantedBy=multi-user.target

[Service]
ExecStart=${join(`/opt/deployer/apps/${app}`, root)}/node build/app.js
EnvironmentFile=${join(`/opt/deployer/apps/${app}`, root)}/env
Restart=always
DynamicUser=yes

RemainAfterExit=yes
NoNewPrivileges=yes
PrivateTmp=yes
ProtectSystem=full
ProtectControlGroups=yes
ProtectKernelModules=yes
ProtectKernelTunables=yes
RestrictNamespaces=yes
LockPersonality=yes
PrivateDevices=yes
ProtectClock=yes
ProtectKernelLogs=yes
RestrictSUIDSGID=yes
ProtectHome=true
PrivateUsers=yes
RuntimeDirectory="${apiRuntime}-#%i"
StateDirectory="${apiRuntime}-#%i"
CacheDirectory="${apiRuntime}-#%i"
LogsDirectory="${apiRuntime}-#%i"
ConfigurationDirectory="${apiRuntime}-#%i"
`;

  writeFileSync(`./generated/${apiRuntime}-green@.service`, templateWorker);
  writeFileSync(`./generated/${apiRuntime}-blue@.service`, templateWorker);

  const targetGreen = `
[Unit]
Description="${apiRuntime} green workers"
Wants=${greenPorts.map(p => `${apiRuntime}-green@${p}.service`).join(" ")}

[Install]
WantedBy=multi-user.target
`;

  const targetBlue = `
[Unit]
Description="${apiRuntime} blue workers"
Wants=${bluePorts.map(p => `${apiRuntime}-blue@${p}.service`).join(" ")}

[Install]
WantedBy=multi-user.target
`;

  writeFileSync(`./generated/${apiRuntime}-green.target`, targetGreen);
  writeFileSync(`./generated/${apiRuntime}-blue.target`, targetBlue);
}; 