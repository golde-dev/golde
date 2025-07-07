import { describe, it } from "@std/testing/bdd";
import { resolveConfig } from "../config.ts";
import { expect } from "@std/expect/expect";
import { getGitInfo, type GitInfo } from "../utils/git.ts";

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
      resources: {
        cloudflare: {
          r2: {
            bucket: {
              [`bucket-{{ env.NAME }}`]: {
                storageClass: "Standard",
              },
            },
          },
        },
      }
    }, gitInfo);

    expect(config).toEqual({
      name: "test",
      providers: {
        aws: {
          accessKeyId: "test",
          secretAccessKey: "test",
        },
      },
      resources: {    
        cloudflare: {
          r2: {
            bucket: {
              "bucket-name": {
                branch: "master",
                storageClass: "Standard",
              },
            },
          },
        },
      }
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
      resources: {
        cloudflare: {
          r2: {
            bucket: {
              [`{{ git.BRANCH_NAME }}-{{ git.BRANCH_SLUG }}`]: {
                storageClass: "Standard",
                branch: "master",
              },
            },
          },
        },
      }
    }, gitInfo);

    expect(config).toEqual({
      name: "test",
      tags: {
        BRANCH_NAME: "master",
        BRANCH_SLUG: "master",
      },
      resources: {
        cloudflare: {
          r2: {
            bucket: {
              "master-master": {
                storageClass: "Standard",
                branch: "master",
              },
            },
          },
        },
      }
    });
  });

  it("should include resources only for selected branch", () => {
    const gitInfo = {
      branchName: "feature/test",
      branchSlug: "feature-test",
    } as GitInfo;

    const config = resolveConfig(
      {
        name: "test",
        resources: {
          cloudflare: {
            r2: {
              bucket: {
                [`bucket`]: {
                  storageClass: "Standard",
                  branch: "master",
                },
                [`bucket-branch-{{ git.BRANCH_SLUG }}`]: {
                  storageClass: "Standard",
                  branch: "{{ git.BRANCH_NAME }}",
                },
                [`bucket-pattern-{{ git.BRANCH_SLUG }}`]: {
                  storageClass: "Standard",
                  branchPattern: "feature/*",
                  branch: "{{ git.BRANCH_NAME }}",
                },
              },
            },
          },
        }
      },
      gitInfo,
      "feature/test",
    );

    expect(config).toEqual({
      name: "test",
      resources: {
        cloudflare: {
          r2: {
            bucket: {
              "bucket-branch-feature-test": {
                storageClass: "Standard",
                branch: "feature/test",
              },
              "bucket-pattern-feature-test": {
                storageClass: "Standard",
                branchPattern: "feature/*",
                branch: "feature/test",
              },
            },
          },
        },
      }
    });
  });

  it("should exclude resources when pattern do not match", () => {
    const gitInfo = {
      branchName: "dependencies/test",
      branchSlug: "dependencies-test",
    } as GitInfo;

    const config = resolveConfig(
      {
        name: "test",
        resources: {
          cloudflare: {
            r2: {
              bucket: {
                [`bucket-pattern-{{ git.BRANCH_SLUG }}`]: {
                  storageClass: "Standard",
                  branchPattern: "feature/*",
                  branch: "{{ git.BRANCH_NAME }}",
                },
              },
            },
          },
        }
      },
      gitInfo,
      "feature/test",
    );

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
      resources: {
        cloudflare: {
          r2: {
            bucket: {
              [`bucket`]: {
                storageClass: "Standard",
                branch: "master",
              },
              [`bucket-branch-{{ git.BRANCH_SLUG }}`]: {
                storageClass: "Standard",
                branch: "{{ git.BRANCH_NAME }}",
              },
              [`bucket-pattern-{{ git.BRANCH_SLUG }}`]: {
                storageClass: "Standard",
                branchPattern: "feature/*",
                branch: "{{ git.BRANCH_NAME }}",
              },
            },
          },
        },
      }
    }, gitInfo);

    expect(config).toEqual({
      name: "test",
      resources: {
        cloudflare: {
          r2: {
            bucket: {
              bucket: {
                storageClass: "Standard",
                branch: "master",
              },
              "bucket-branch-feature-test": {
                storageClass: "Standard",
                branch: "feature/test",
              },
              "bucket-pattern-feature-test": {
                storageClass: "Standard",
                branchPattern: "feature/*",
                branch: "feature/test",
              },
            },
          },
        },
      }
    });
  });
});
