import { logger } from "../../logger.ts";
import { AWSClientBase } from "./base.ts";
import {
  AttachRolePolicyCommand,
  CreateRoleCommand,
  DeleteRoleCommand,
  DeleteRolePolicyCommand,
  DetachRolePolicyCommand,
  GetRoleCommand,
  PutRolePolicyCommand,
  TagRoleCommand,
  UpdateAssumeRolePolicyCommand,
} from "@aws-sdk/client-iam";
import type {
  CreateRoleCommandInput,
  CreateRoleCommandOutput,
  DeleteRoleCommandInput,
  DeleteRoleCommandOutput,
  PutRolePolicyCommandInput,
  PutRolePolicyCommandOutput,
  Tag,
  TagRoleCommandInput,
  TagRoleCommandOutput,
  UpdateAssumeRolePolicyCommandInput,
  UpdateAssumeRolePolicyCommandOutput,
} from "@aws-sdk/client-iam";

export class IAMClient extends AWSClientBase {
  public async checkIAMRoleExists(role: string, region?: string) {
    try {
      logger.debug({ role }, "[AWS] Check AIM role exists");
      const command = new GetRoleCommand({
        RoleName: role,
      });
      await this
        .getIAMClient(region)
        .send(command);
      return true;
    } catch {
      return false;
    }
  }

  public async createIAMRole(
    input: CreateRoleCommandInput,
  ): Promise<CreateRoleCommandOutput> {
    try {
      logger.debug({ input }, "[AWS] Creating IAM role");
      const command = new CreateRoleCommand(input);
      const result = await this
        .getIAMClient()
        .send<CreateRoleCommandInput, CreateRoleCommandOutput>(command);

      return result;
    } catch (e) {
      if (e instanceof Error) {
        logger.error(e, "[AWS] Failed to create IAM role");
      }
      throw e;
    }
  }

  public async updateAssumeRolePolicyToIAMRole(
    role: string,
    assumeRolePolicyDocument: string,
  ): Promise<void> {
    try {
      logger.debug({ role, assumeRolePolicyDocument }, "[AWS] Updating assume role policy to role");
      const command = new UpdateAssumeRolePolicyCommand({
        RoleName: role,
        PolicyDocument: assumeRolePolicyDocument,
      });
      await this
        .getIAMClient()
        .send<UpdateAssumeRolePolicyCommandInput, UpdateAssumeRolePolicyCommandOutput>(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error(e, "[AWS] Failed to update assume role policy to role");
      }
      throw e;
    }
  }

  public async updateIAmRoleTags(role: string, tags: Tag[]) {
    try {
      logger.debug({ role, tags }, "[AWS] Updating tags to role");
      const command = new TagRoleCommand({
        RoleName: role,
        Tags: tags,
      });
      await this
        .getIAMClient()
        .send<TagRoleCommandInput, TagRoleCommandOutput>(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error(e, "[AWS] Failed to update tags to role");
      }
      throw e;
    }
  }

  public async attachManagedPolicyToIAMRole(
    role: string,
    policyArn: string,
  ): Promise<void> {
    try {
      logger.debug({ role, policyArn }, "[AWS] Attaching policy to role");
      const command = new AttachRolePolicyCommand({
        RoleName: role,
        PolicyArn: policyArn,
      });
      await this
        .getIAMClient()
        .send(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error(e, "[AWS] Failed to attach policy to role");
      }
      throw e;
    }
  }

  public async removeManagedPolicyFromIAMRole(role: string, policyArn: string): Promise<void> {
    try {
      logger.debug({ role, policyArn }, "[AWS] Removing managed policy from role");
      const command = new DetachRolePolicyCommand({
        RoleName: role,
        PolicyArn: policyArn,
      });
      await this
        .getIAMClient()
        .send(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error(e, "[AWS] Failed to remove managed policy from role");
      }
      throw e;
    }
  }

  public async deleteIAMRole(role: string): Promise<void> {
    try {
      logger.debug({ role }, "[AWS] Deleting IAM role");
      const command = new DeleteRoleCommand({
        RoleName: role,
      });
      await this
        .getIAMClient()
        .send<DeleteRoleCommandInput, DeleteRoleCommandOutput>(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error(e, "[AWS] Failed to delete IAM role");
      }
      throw e;
    }
  }

  public async putInlinePolicyToIAMRole(
    role: string,
    policy: string,
  ): Promise<void> {
    try {
      logger.debug({ role, policy, name }, "[AWS] Putting inline policy to role");
      const command = new PutRolePolicyCommand({
        RoleName: role,
        PolicyName: `${role}-inline-policy`,
        PolicyDocument: policy,
      });
      await this
        .getIAMClient()
        .send<PutRolePolicyCommandInput, PutRolePolicyCommandOutput>(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error(e, "[AWS] Failed to put inline policy to role");
      }
      throw e;
    }
  }

  public async removeInlinePolicyFromIAMRole(role: string): Promise<void> {
    try {
      logger.debug({ role }, "[AWS] Removing inline policy from role");
      const command = new DeleteRolePolicyCommand({
        RoleName: role,
        PolicyName: `${role}-inline-policy`,
      });
      await this
        .getIAMClient()
        .send(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error(e, "[AWS] Failed to remove inline policy from role");
      }
      throw e;
    }
  }
}
