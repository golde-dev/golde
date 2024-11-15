import type { Tags } from "../../types/config.ts";
import { tagEntriesTags } from "../../utils/tags.ts";
import { AWSClientBase } from "./base.ts";
import {
  ResourceGroupsTaggingAPIClient,
  TagResourcesCommand,
  UntagResourcesCommand,
} from "@aws-sdk/client-resource-groups-tagging-api";

export class TaggingClient extends AWSClientBase {
  public getResourceGroupsTaggingAPIClient() {
    return new ResourceGroupsTaggingAPIClient({
      region: this.region ?? this.defaultRegion,
      credentials: {
        accessKeyId: this.accessKeyId,
        secretAccessKey: this.secretAccessKey,
      },
    });
  }

  public async updateResourceTags(resourceARN: string, prevTags: Tags = {}, newTags: Tags = {}) {
    const tagsToRemove = Object
      .entries(prevTags)
      .filter(([key]) => !newTags[key])
      .map(([key]) => key);

    if (tagsToRemove.length) {
      const untagCommand = new UntagResourcesCommand({
        ResourceARNList: [resourceARN],
        TagKeys: tagsToRemove,
      });
      await this
        .getResourceGroupsTaggingAPIClient()
        .send(untagCommand);
    }
    const tagsToAdd = Object.entries(newTags).filter(([key]) => !prevTags[key]);
    const tagsToUpdate = Object.entries(newTags).filter(([key]) => prevTags[key]);
    const tagsToAddOrUpdate = [
      ...tagsToAdd,
      ...tagsToUpdate,
    ];

    if (tagsToAddOrUpdate.length) {
      const tagCommand = new TagResourcesCommand({
        ResourceARNList: [resourceARN],
        Tags: tagEntriesTags(tagsToAddOrUpdate),
      });
      await this
        .getResourceGroupsTaggingAPIClient()
        .send(tagCommand);
    }
  }
}
