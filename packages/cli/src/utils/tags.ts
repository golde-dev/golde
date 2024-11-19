import { z } from "zod";
import type { Tags } from "../types/config.ts";

import { isUndefined } from "@es-toolkit/es-toolkit";
import { isEmpty } from "./object.ts";

export const tagsSchema = z.record(z.string()).optional();

export function mergeTags(tags?: Tags, other?: Tags): Tags | undefined {
  if (isEmpty(tags) && isEmpty(other)) {
    return;
  }
  if (!tags) {
    return other;
  }
  if (!other) {
    return tags;
  }
  return {
    ...tags,
    ...other,
  };
}

export function tagEntriesTags(tags: [string, string][]): Tags {
  return tags.reduce((acc, [key, value]) => {
    return {
      ...acc,
      [key]: value,
    };
  }, {});
}

export function toTagsArray(tags?: Tags): string[] | undefined {
  if (isEmpty(tags) || isUndefined(tags)) {
    return;
  }

  return Object.entries(tags).map(([name, value]) => {
    if (!value) {
      return name;
    }
    return `${name}:${value}`;
  });
}

interface Tag {
  Key: string;
  Value: string;
}

export function toTagsList(tags?: Tags): Tag[] | undefined {
  if (isEmpty(tags) || isUndefined(tags)) {
    return;
  }
  return Object
    .entries(tags)
    .map(([Key, Value]) => {
      return {
        Key,
        Value,
      };
    });
}

export function mergeProjectTags<C extends { tags?: Tags }>(
  { tags, ...config }: C,
  projectTags?: Tags,
) {
  return {
    ...config,
    tags: mergeTags(projectTags, tags),
  };
}
