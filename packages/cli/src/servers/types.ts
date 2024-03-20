

export interface HCloudServerConfig {
  type: string;
}

export interface ServersConfig {
  hcloud?: {
    [hostname: string]: HCloudServerConfig
  }
}

export interface HCloudServerState {
  id: number;
}


export interface ServersState {
  hcloud?: {
    [hostname: string]: HCloudServerState
  }
}