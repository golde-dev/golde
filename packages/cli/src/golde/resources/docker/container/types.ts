import type { ResourceConfig, WithBranch } from "@/types/config.ts";

export interface ContainerConfig extends ResourceConfig {
  server: string;
  image: string;
}

export interface ContainerState {
  createdAt: string;
  updatedAt?: string;
  config: WithBranch<ContainerConfig>;
}

export interface ContainersState {
  [containerName: string]: ContainerState;
}

export interface ContainersConfig {
  [containerName: string]: ContainerConfig;
}
