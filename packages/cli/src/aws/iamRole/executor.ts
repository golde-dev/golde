import { isEqual } from "@es-toolkit/es-toolkit";
import { PlanError, PlanErrorCode } from "../../error.ts";
import { logger } from "../../logger.ts";
import { stringify } from "../../utils/object.ts";
import { nowStringDate } from "../../utils/date.ts";
import { join } from "@std/path";
import type { WithBranch } from "../../types/config.ts";
import { formatDuration } from "../../utils/duration.ts";
import { assertBranch } from "../../utils/resource.ts";
import { toTagsList } from "../../utils/tags.ts";
import type { AWSClient } from "../client/client.ts";
import type { RoleConfig, RoleState } from "./types.ts";
import type { ResourceDependency } from "../../types/dependencies.ts";

function aimRoleArn({ accountId }: AWSClient, roleName: string, path: string = "/") {
  if (!accountId) {
    throw new Error("AWS client not initialized");
  }
  return `arn:aws:iam::${accountId}:role${join(path, roleName)}`;
}

export async function createRole(
  this: AWSClient,
  roleName: string,
  config: WithBranch<RoleConfig>,
  dependsOn: ResourceDependency[],
): Promise<RoleState> {
  assertBranch(config);

  const {
    tags,
    path,
    description,
    inlinePolicy,
    permissionsBoundaryArn,
    assumeRolePolicy,
    managedPoliciesArns = [],
  } = config;

  const start = Date.now();

  const tagsList = toTagsList(tags);
  const assumeRolePolicyDocument = stringify(assumeRolePolicy);

  await this.createIAMRole({
    RoleName: roleName,
    Path: path,
    Description: description,
    PermissionsBoundary: permissionsBoundaryArn,
    AssumeRolePolicyDocument: assumeRolePolicyDocument,
    Tags: tagsList,
  });

  if (inlinePolicy) {
    logger.debug(`[AWS] Putting inline policy to role ${roleName}`);
    const inlinePolicyDocument = stringify(inlinePolicy);
    await this.putInlinePolicyToIAMRole(
      roleName,
      inlinePolicyDocument,
    );
  }

  for (const policyArn of managedPoliciesArns) {
    logger.debug(`[AWS] Attaching managed policy ${policyArn} to role ${name}`);
    await this.attachManagedPolicyToIAMRole(roleName, policyArn);
  }

  const end = Date.now();
  logger.debug(`[AWS] Created AIM role ${roleName} in ${formatDuration(end - start)}`);

  const arn = aimRoleArn(this, roleName, path);
  const createdAt = nowStringDate();
  return {
    arn,
    createdAt,
    dependsOn,
    config,
  };
}
export type CreateRole = typeof createRole;

export async function deleteRole(
  this: AWSClient,
  name: string,
): Promise<void> {
  const start = Date.now();
  await this.deleteIAMRole(name);
  const end = Date.now();
  logger.debug(`[AWS] Deleted AIM role ${name} in ${formatDuration(end - start)}`);
}

export type DeleteRole = typeof deleteRole;

export async function updateRole(
  this: AWSClient,
  roleName: string,
  config: WithBranch<RoleConfig>,
  state: RoleState,
  dependsOn: ResourceDependency[],
): Promise<RoleState> {
  const {
    tags,
    assumeRolePolicy,
    inlinePolicy,
    managedPoliciesArns = [],
  } = config;

  const {
    arn,
    createdAt,
    config: {
      tags: previousTags,
      inlinePolicy: previousInlinePolicy,
      assumeRolePolicy: previousAssumeRolePolicy,
      managedPoliciesArns: previousManagedPoliciesArns = [],
    },
  } = state;
  const start = performance.now();

  if (!isEqual(previousTags, tags)) {
    logger.debug(`[AWS] Updating tags to role ${name}`);
    const tagsList = toTagsList(tags) ?? [];
    await this.updateIAmRoleTags(roleName, tagsList);
  }

  if (!isEqual(previousAssumeRolePolicy, assumeRolePolicy)) {
    logger.debug(`[AWS] Updating assume role policy to role ${name}`);
    const assumeRolePolicyDocument = stringify(assumeRolePolicy);
    await this.updateAssumeRolePolicyToIAMRole(
      roleName,
      assumeRolePolicyDocument,
    );
  }

  if (!inlinePolicy && previousInlinePolicy) {
    logger.debug(`[AWS] Removing inline policy from role ${name}`);
    await this.removeInlinePolicyFromIAMRole(roleName);
  } else if (inlinePolicy) {
    if (!isEqual(previousInlinePolicy, inlinePolicy)) {
      logger.debug(`[AWS] Updating inline policy to role ${name}`);
      const inlinePolicyDocument = stringify(inlinePolicy);
      await this.putInlinePolicyToIAMRole(
        roleName,
        inlinePolicyDocument,
      );
    }
  }

  if (!isEqual(previousManagedPoliciesArns, managedPoliciesArns)) {
    logger.debug(`[AWS] Updating managed policies to role ${name}`);
    for (const policyArn of managedPoliciesArns) {
      if (!previousManagedPoliciesArns.includes(policyArn)) {
        logger.debug(`[AWS] Attaching managed policy ${policyArn} to role ${name}`);
        await this.attachManagedPolicyToIAMRole(roleName, policyArn);
      }
    }
    for (const policyArn of previousManagedPoliciesArns) {
      if (!managedPoliciesArns.includes(policyArn)) {
        logger.debug(`[AWS] Removing managed policy ${policyArn} from role ${name}`);
        await this.removeManagedPolicyFromIAMRole(roleName, policyArn);
      }
    }
  }

  const end = performance.now();
  logger.debug(`[AWS] Updated AIM role ${name} in ${formatDuration(end - start)}`);

  const updatedAt = nowStringDate();

  return {
    arn,
    createdAt,
    updatedAt,
    dependsOn,
    config,
  };
}

export type UpdateRole = typeof updateRole;

export async function assertRoleExist(this: AWSClient, name: string) {
  const start = performance.now();
  const exists = await this.checkIAMRoleExists(name);
  const end = performance.now();
  logger.debug(`[AWS] Checked IAM role ${name} exists in ${formatDuration(end - start)}`);
  if (!exists) {
    throw new PlanError(`Bucket ${name} does not exist`, PlanErrorCode.RESOURCE_NOT_FOUND);
  }
}

export async function assertRoleNotExist(this: AWSClient, name: string) {
  const start = performance.now();
  const exists = await this.checkIAMRoleExists(name);
  const end = performance.now();
  logger.debug(`[AWS] Checked IAM role ${name} exists in ${formatDuration(end - start)}`);
  if (exists) {
    throw new PlanError(`AIM role ${name} already exists`, PlanErrorCode.RESOURCE_EXISTS);
  }
}

export async function assertCreatePermission(this: AWSClient, name: string, path?: string) {
  const start = performance.now();
  const roleArn = aimRoleArn(this, name, path);
  const [allowed, reason] = await this.checkPermission(
    [
      "iam:GetPolicy",
      "iam:TagRole",
      "iam:CreateRole",
      "iam:PassRole",
      "iam:PutRolePolicy",
      "iam:AttachRolePolicy",
    ],
    [roleArn],
  );
  const end = performance.now();
  logger.debug(
    `[AWS] Checked create permission for role ${name} in ${formatDuration(end - start)}`,
  );
  if (!allowed) {
    logger.error(`[AWS] Create permission denied for role ${name}`, reason);
    throw new PlanError(`Cannot create role ${name}`, PlanErrorCode.PERMISSION_DENIED);
  }
}
export async function assertDeletePermission(this: AWSClient, name: string, path?: string) {
  const start = performance.now();
  const roleArn = aimRoleArn(this, name, path);
  const [allowed, reason] = await this.checkPermission(
    ["iam:DeleteRole"],
    [roleArn],
  );
  const end = performance.now();
  logger.debug(
    `[AWS] Checked permission to delete role ${roleArn} in ${formatDuration(end - start)}`,
  );
  if (!allowed) {
    logger.error(`[AWS] Delete permission denied for role ${roleArn}`, reason);
    throw new PlanError(`Cannot delete role ${roleArn}`, PlanErrorCode.PERMISSION_DENIED);
  }
}

export async function assertUpdatePermission(this: AWSClient, name: string, path?: string) {
  const start = performance.now();
  const roleArn = aimRoleArn(this, name, path);
  const [allowed, reason] = await this.checkPermission(
    [
      "iam:UpdateAssumeRolePolicy",
      "iam:PutRolePolicy",
      "iam:AttachRolePolicy",
      "iam:DetachRolePolicy",
      "iam:TagRole",
      "iam:UntagRole",
      "iam:PassRole",
    ],
    [roleArn],
  );
  const end = performance.now();
  logger.debug(
    `[AWS] Checked permission for update role ${roleArn} in ${formatDuration(end - start)}`,
  );
  if (!allowed) {
    logger.error(`[AWS] Update permissions denied for ${roleArn}`, reason);
    throw new PlanError(`Cannot update role ${roleArn}`, PlanErrorCode.PERMISSION_DENIED);
  }
}

export function getDefaultRegion(this: AWSClient) {
  return this.region ?? this.defaultRegion;
}

export const createIAMRoleExecutors = (aws: AWSClient) => {
  return {
    getDefaultRegion: getDefaultRegion.bind(aws),

    createRole: createRole.bind(aws),
    deleteRole: deleteRole.bind(aws),
    updateRole: updateRole.bind(aws),

    assertCreatePermission: assertCreatePermission.bind(aws),
    assertDeletePermission: assertDeletePermission.bind(aws),
    assertUpdatePermission: assertUpdatePermission.bind(aws),
    assertRoleExist: assertRoleExist.bind(aws),
    assertRoleNotExist: assertRoleNotExist.bind(aws),
  };
};

export type Executors = ReturnType<typeof createIAMRoleExecutors>;
