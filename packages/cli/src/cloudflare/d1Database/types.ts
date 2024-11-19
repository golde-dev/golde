import type { Resource, WithBranch } from "../../types/config.ts";
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
  config: WithBranch<DatabaseConfig>;
}

export interface D1DatabaseState {
  [databaseName: string]: DatabaseState;
}
