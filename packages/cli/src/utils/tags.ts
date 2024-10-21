import { z } from "zod";
import type { Tags } from "../types/config.ts";

export const tagsSchema = z.record(z.string()).optional();

export function mergeTags(tags?: Tags, other?: Tags) {
  if (!tags && !other) {
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

export function toTagsArray(tags?: Tags): string[] | undefined {
  if (!tags) {
    return;
  }

  return Object.entries(tags).map(([name, value]) => {
    if (!value) {
      return name;
    }
    return `${name}:${value}`;
  });
}
