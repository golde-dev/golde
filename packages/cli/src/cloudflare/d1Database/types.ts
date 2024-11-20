import type { Resource, WithBranch } from "../../types/config.ts";
import type { ResourceDependency } from "../../types/dependencies.ts";
import type { Region } from "../client/types.ts";

export interface DatabaseConfig extends Resource {
  locationHint?: Region;
}

export interface D1DatabaseConfig {
  [databaseName: string]: DatabaseConfig;
}

export interface DatabaseState {
  uuid: string;
  createdAt: string;
  updatedAt?: string;
  dependsOn: ResourceDependency[];
  config: WithBranch<DatabaseConfig>;
}

export interface D1DatabaseState {
  [databaseName: string]: DatabaseState;
}
