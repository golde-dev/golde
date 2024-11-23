import type { Resource, Tags, WithBranch } from "../../../types/config.ts";
import type { ResourceDependency } from "../../../types/dependencies.ts";
import type { WithRegion } from "../../types.ts";

export interface UserConfig extends Resource {
  tags?: Tags;
  managedPoliciesArns?: string[];
}

export interface IAMUserConfig {
  [userName: string]: UserConfig;
}

export interface UserState {
  createdAt: string;
  updatedAt?: string;
  arn: string;
  dependsOn: ResourceDependency[];
  config: WithRegion<WithBranch<IAMUserConfig>>;
}

export interface IAMUserState {
  [userName: string]: UserState;
}
