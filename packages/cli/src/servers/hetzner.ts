

interface HetznerServerConfig {
  type: string;
}

export interface ServersConfig {
  hetzner?: {
    [hostname: string]: HetznerServerConfig
  }
}