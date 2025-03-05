import type { Resource, Tags, WithBranch } from "../../../../types/config.ts";
import type { ResourceDependency } from "../../../../types/dependencies.ts";
import type { WithRegion } from "../../../types.ts";

export interface ServiceConfig extends Resource {
  region?: string;
  tags?: Tags;
}

export interface AppRunnerServiceConfig {
  [serviceName: string]: ServiceConfig;
}

export interface ServiceState {
  createdAt: string;
  updatedAt?: string;
  arn: string;
  dependsOn: ResourceDependency[];
  config: WithRegion<WithBranch<ServiceConfig>>;
}

export interface AppRunnerServiceState {
  [serviceName: string]: ServiceState;
}
