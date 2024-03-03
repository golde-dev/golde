

export interface HCloudServerConfig {
  type: string;
}

export interface ServersConfig {
  hcloud?: {
    [hostname: string]: HCloudServerConfig
  }
}