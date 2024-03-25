import { join } from "node:path";

export type DeployConfig = Record<string, HostDeployApps>;

export type NodeJSProxyApp = {
  root: string,
  match: string,
  nodeVersion: `${number}.${number}.${number}`
  systemdTemplate: string,
  greenPorts: number[]
  bluePorts: number[]
};

export type ReverseProxyApp = NodeJSProxyApp;

export type HostDeployApps = Record<string, {
  domain: string;
  fileServer?: Record<string, {
    match: string,
    root: string
  }>;
  reverseProxy?: Record<string, ReverseProxyApp>
}>;

export type BranchMapping = {
  app: string;
  domain: string;
  hosts: string[]
};

export interface CaddyConfig {
  type: "caddy",
  artifactsPaths: string[];
  staticServer: Record<string, {
    match: string,
    root: string
  }>
  reverseProxy: Record<string, ReverseProxyApp>;
  branchMapping: Record<string, BranchMapping>;
}
export function translate(config: HostDeployApps) {
  return {
    apps: {
      http: {
        servers: {
          deployedApps: {
            listen: [
              ":443",
            ],
            routes: Object.entries(config).map(([app, appConf]) => {
              const {
                domain,
                fileServer = {},
                reverseProxy = {},
              } = appConf;

              const wwwRedirectRoute = {
                "match": [
                  {
                    "host": [
                      `www.${domain}`,
                    ],
                  },
                ],
                "handle": [
                  {
                    "handler": `${app}-www-redirect`,
                    "routes": [
                      {
                        "handle": [
                          {
                            "handler": "static_response",
                            "headers": {
                              "Location": [
                                `https://${domain}{http.request.uri}`,
                              ],
                            },
                            "status_code": 302,
                          },
                        ],
                      },
                    ],
                  },
                ],
                "terminal": true,
              };

              const staticRoutesHandles = Object.entries(fileServer).map(([route, staticRoute]) => {
                const {
                  root,
                  match,
                } = staticRoute;
                return {
                  "group": route,
                  "handle": [
                    {
                      "handler": `subroute-${route}`,
                      "routes": [
                        {
                          "handle": [
                            {
                              "handler": "file_server",
                              "hide": [
                                "./Caddyfile",
                              ],
                              "root": join(`/opt/deployer/apps/${app}/current/`, root),
                            },
                          ],
                        },
                      ],
                    },
                  ],
                  "match": [
                    {
                      "path": [
                        match,
                      ],
                    },
                  ],
                };
              });
              

              const proxyRoutesHandles = Object.entries(reverseProxy).map(([route, proxyRoute]) => {
                const {
                  match,
                  bluePorts, 
                } = proxyRoute;

                return {
                  "group": route,
                  "handle": [
                    {
                      "handler": `subroute-${route}`,
                      "routes": [
                        {
                          "handle": [
                            {
                              "handler": "reverse_proxy",
                              "load_balancing": {
                                "retries": 2,
                                "selection_policy": {
                                  "policy": "round_robin",
                                },
                              },
                              "upstreams": bluePorts.map(port => (
                                {
                                  "dial": `localhost:${port}`,
                                })
                              ),
                            },
                          ],
                        },
                      ],
                    },
                  ],
                  "match": [
                    {
                      "path": [
                        match,
                      ],
                    },
                  ],
                };
              });

              const mainRoute = {
                "match": [
                  {
                    "host": [
                      domain,
                    ],
                  },
                ],
                "handle": [{
                  "handler": "subroute",
                  "routes": [
                    ...proxyRoutesHandles,
                    ...staticRoutesHandles,
                  ],
                }],
                "terminal": true,
              };

              return [wwwRedirectRoute, mainRoute];
            }).flat(),
          },
        },
      },
    },
  };
}

