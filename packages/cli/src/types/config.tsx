
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


export type Config = Record<string, CaddyConfig>;
