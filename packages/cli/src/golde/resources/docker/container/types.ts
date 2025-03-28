import type { ResourceConfig, Tags, WithBranch } from "@/types/config.ts";
import type { ResourceDependency } from "@/types/dependencies.ts";

export interface ContainerConfig extends ResourceConfig {
  server: string;
  image: string;
  tags?: Tags;
}

export interface ContainerState {
  createdAt: string;
  updatedAt?: string;
  config: WithBranch<ContainerConfig>;
  dependsOn: ResourceDependency[];
}

export interface ContainersState {
  [containerName: string]: ContainerState;
}

export interface ContainersConfig {
  [containerName: string]: ContainerConfig;
}
