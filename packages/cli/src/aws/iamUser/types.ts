import type { Resource, Tags, WithBranch } from "../../types/config.ts";
import type { WithRegion } from "../types.ts";

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
  config: WithRegion<WithBranch<IAMUserConfig>>;
}

export interface IAMUserState {
  [userName: string]: UserState;
}
