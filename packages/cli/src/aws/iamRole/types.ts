import type { Resource, Tags, WithBranch } from "../../types/config.ts";
import type { ResourceDependency } from "../../types/dependencies.ts";

export interface PolicyDocument {
  Version: "2012-10-17";
  Statement: Statement[];
}

export interface Statement {
  Effect: "Allow" | "Deny";
  Sid?: string;
  Action: string[] | string;
  Principal?: {
    AWS?: string[] | string;
    Service?: string[] | string;
    Federated?: string[] | string;
    CanonicalUser?: string[] | string;
  };
  Resource?: string[] | string;
}

export interface RoleConfig extends Resource {
  tags?: Tags;
  path?: string;
  description?: string;
  permissionsBoundaryArn?: string;
  inlinePolicy?: PolicyDocument;
  assumeRolePolicy: PolicyDocument;
  managedPoliciesArns?: string[];
}

export interface IAMRoleConfig {
  [roleName: string]: RoleConfig;
}

export interface RoleState {
  createdAt: string;
  updatedAt?: string;
  arn: string;
  dependsOn: ResourceDependency[];
  config: WithBranch<RoleConfig>;
}

export interface IAMRoleState {
  [objectName: string]: RoleState;
}
