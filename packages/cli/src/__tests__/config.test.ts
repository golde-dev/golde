import { describe, it } from "@std/testing/bdd";
import { resolveConfig } from "../config.ts";
import { expect } from "@std/expect/expect";
import { getGitInfo, type GitInfo } from "../clients/git.ts";

describe("resolveConfig", () => {
  Deno.env.set("TEST", "test");
  Deno.env.set("NAME", "name");

  it("should resolve env variables", () => {
    const gitInfo = getGitInfo();
    
    const config = resolveConfig({
      name: "test",
      providers: {
        aws: {
          accessKeyId: "{{ env.TEST }}",
          secretAccessKey: "{{ env.TEST }}",
        },
      },
      buckets: {
        cloudflare: {
          [`bucket_{{ env.NAME }}`]: {
            storageClass: "Standard",
          },
        },
      },
    }, gitInfo);

    expect(config).toEqual({
      name: "test",
      providers: {
        aws: {
          accessKeyId: "test",
          secretAccessKey: "test",
        },
      },
      buckets: {
        cloudflare: {
          bucket_name: {
            storageClass: "Standard",
          },
        },
      },
    });
  });
  
  it("should resolve files", () => {
  });

  it("should resolve git variables", () => {
    const gitInfo = {
      branchName: "master",
      branchSlug: "master",
    } as GitInfo;

    const config = resolveConfig({
      name: "test", 
      tags: {
        "BRANCH_NAME": "{{ git.BRANCH_NAME }}",
        "BRANCH_SLUG": "{{ git.BRANCH_SLUG }}",
      },
      buckets: {
        cloudflare: {
          [`{{ git.BRANCH_NAME }}-{{ git.BRANCH_SLUG }}`]: {
            storageClass: "Standard",
            branch: "master",
          },
        },
      },
    }, gitInfo);

    expect(config).toEqual({
      name: "test",
      tags: {
        BRANCH_NAME: "master",
        BRANCH_SLUG: "master",
      },
      buckets: {
        cloudflare: {
          "master-master": { 
            storageClass: "Standard",
            branch: "master",
          },
        },
      },
    }); 
  });

  it("should include resources only for selected branch", () => {
    const gitInfo = {
      branchName: "feature/test",
      branchSlug: "feature-test",
    } as GitInfo;

    const config = resolveConfig({
      name: "test",
      buckets: {
        cloudflare: {
          [`bucket`]: {
            storageClass: "Standard",
            branch: "master",
          },
          [`bucket_branch_{{ git.BRANCH_SLUG }}`]: {
            storageClass: "Standard",
            branch: "{{ git.BRANCH_NAME }}",
          },
          [`bucket_pattern_{{ git.BRANCH_SLUG }}`]: {
            storageClass: "Standard",
            branchPattern: "feature/*",
            branch: "{{ git.BRANCH_NAME }}",
          },
        },
      },
    }, gitInfo,"feature/test");

    expect(config).toEqual({
      name: "test",
      buckets: {
        cloudflare: {
          "bucket_branch_feature-test": {
            storageClass: "Standard",
            branch: "feature/test",
          },
          "bucket_pattern_feature-test": {
            storageClass: "Standard",
            branchPattern: "feature/*",
            branch: "feature/test",
          },
        },
      },
    });
  });

  it("should exclude resources when pattern do not match", () => {
    const gitInfo = {
      branchName: "dependencies/test",
      branchSlug: "dependencies-test",
    } as GitInfo;

    const config = resolveConfig({
      name: "test",
      buckets: {
        cloudflare: {
          [`bucket_pattern_{{ git.BRANCH_SLUG }}`]: {
            storageClass: "Standard",
            branchPattern: "feature/*",
            branch: "{{ git.BRANCH_NAME }}",
          },
        },
      },
    }, gitInfo,"feature/test");

    expect(config).toEqual({
      name: "test",
    });
  });

  it("should return full config if argument branch name is omitted", () => {
    const gitInfo = {
      branchName: "feature/test",
      branchSlug: "feature-test",
    } as GitInfo;

    const config = resolveConfig({
      name: "test",
      buckets: {
        cloudflare: {
          [`bucket`]: {
            storageClass: "Standard",
            branch: "master",
          },
          [`bucket_branch_{{ git.BRANCH_SLUG }}`]: {
            storageClass: "Standard",
            branch: "{{ git.BRANCH_NAME }}",
          },
          [`bucket_pattern_{{ git.BRANCH_SLUG }}`]: {
            storageClass: "Standard",
            branchPattern: "feature/*",
            branch: "{{ git.BRANCH_NAME }}",
          },
        },
      },
    }, gitInfo);

    expect(config).toEqual({
      name: "test",
      buckets: {
        cloudflare: {
          bucket: {
            storageClass: "Standard",
            branch: "master",
          },
          "bucket_branch_feature-test": {
            storageClass: "Standard",
            branch: "feature/test",
          },
          "bucket_pattern_feature-test": {
            storageClass: "Standard",
            branchPattern: "feature/*",
            branch: "feature/test",
          },
        },
      },
    });
  });
});
