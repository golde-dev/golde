
export type DeployConfig = Record<string, HostDeployApps>;

export type ReverseProxyApp = {
  root: string,
  match: string,
  systemdTemplate: string,
  greenPorts: number[]
  bluePorts: number[]
};

export type HostDeployApps = Record<string, {
  domain: string;
  fileServer?: Record<string, {
    match: string,
    root: string
  }>;
  reverseProxy?: Record<string, ReverseProxyApp>
}>;