import { logger } from "../../logger.ts";

import { tagEntriesTags } from "../../utils/tags.ts";
import { AWSClientBase } from "./base.ts";
import {
  CreateFunctionCommand,
  DeleteFunctionCommand,
  GetFunctionCommand,
  LambdaClient as Client,
  TagResourceCommand,
  UntagResourceCommand,
  UpdateFunctionCodeCommand,
  UpdateFunctionConfigurationCommand,
} from "@aws-sdk/client-lambda";
import type {
  CreateFunctionCommandInput,
  CreateFunctionCommandOutput,
  UpdateFunctionCodeCommandInput,
  UpdateFunctionConfigurationCommandInput,
} from "@aws-sdk/client-lambda";
import type { Tags } from "../../types/config.ts";

const clients = new Map<string, Client>();

export class LambdaClient extends AWSClientBase {
  private getLambdaClient(region: string) {
    if (!clients.has(region)) {
      clients.set(
        region,
        new Client({
          region,
          credentials: {
            accessKeyId: this.accessKeyId,
            secretAccessKey: this.secretAccessKey,
          },
        }),
      );
    }
    return clients.get(region)!;
  }

  public async checkLambdaFunctionExists(lambdaName: string, region: string) {
    try {
      logger.debug("[AWS] Check lambda function exists", { lambdaName });
      const command = new GetFunctionCommand({
        FunctionName: lambdaName,
      });
      await this.getLambdaClient(region).send(command);
      return true;
    } catch {
      return false;
    }
  }

  public async createLambdaFunction(
    region: string,
    input: CreateFunctionCommandInput,
  ): Promise<CreateFunctionCommandOutput> {
    try {
      logger.debug("[AWS] Creating lambda function", { region, input });
      const command = new CreateFunctionCommand(input);
      const result = await this
        .getLambdaClient(region)
        .send<CreateFunctionCommandInput, CreateFunctionCommandOutput>(command);

      return result;
    } catch (e) {
      if (e instanceof Error) {
        logger.error("[AWS] Failed to create lambda function", e);
      }
      throw e;
    }
  }

  public async deleteLambdaFunction(region: string, functionName: string): Promise<void> {
    try {
      logger.debug("[AWS] Deleting lambda function", { region, functionName });

      const command = new DeleteFunctionCommand({
        FunctionName: functionName,
      });
      await this
        .getLambdaClient(region)
        .send(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error("[AWS] Failed to delete lambda function", e);
      }
      throw e;
    }
  }

  public async updateLambdaFunctionTags(
    functionArn: string,
    region: string,
    prevTags: Tags = {},
    newTags: Tags = {},
  ) {
    try {
      logger.debug("[AWS] Updating lambda function tags", { prevTags, newTags, functionArn });

      const tagsToRemove = Object
        .entries(prevTags)
        .filter(([key]) => !newTags[key])
        .map(([key]) => key);

      if (tagsToRemove.length) {
        const command = new UntagResourceCommand({
          Resource: functionArn,
          TagKeys: tagsToRemove,
        });
        await this
          .getLambdaClient(region)
          .send(command);
      }
      const tagsToAdd = Object.entries(newTags).filter(([key]) => !prevTags[key]);
      const tagsToUpdate = Object.entries(newTags).filter(([key]) => prevTags[key]);
      const tagsToAddOrUpdate = [
        ...tagsToAdd,
        ...tagsToUpdate,
      ];

      if (tagsToAddOrUpdate.length) {
        const tagCommand = new TagResourceCommand({
          Resource: functionArn,
          Tags: tagEntriesTags(tagsToAddOrUpdate),
        });
        await this
          .getLambdaClient(region)
          .send(tagCommand);
      }
    } catch (e) {
      if (e instanceof Error) {
        logger.error("[AWS] Failed to update lambda function tags", e);
      }
      throw e;
    }
  }

  public async updateLambdaFunctionCode(
    region: string,
    input: UpdateFunctionCodeCommandInput,
  ): Promise<void> {
    try {
      logger.debug("[AWS] Updating lambda function code", { region, input });

      const command = new UpdateFunctionCodeCommand(input);
      await this
        .getLambdaClient(region)
        .send(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error("[AWS] Failed to update lambda function code", e);
      }
      throw e;
    }
  }

  public async updateLambdaFunctionConfiguration(
    region: string,
    input: UpdateFunctionConfigurationCommandInput,
  ): Promise<void> {
    try {
      logger.debug("[AWS] Updating lambda function layers", { region, input });

      const command = new UpdateFunctionConfigurationCommand(input);
      await this
        .getLambdaClient(region)
        .send(command);
    } catch (e) {
      if (e instanceof Error) {
        logger.error("[AWS] Failed to update lambda function configuration", e);
      }
      throw e;
    }
  }
}
