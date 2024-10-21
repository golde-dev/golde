import { expect } from "@std/expect";
import { describe, it } from "@std/testing/bdd";
import { createCloudflareDNSPlan, createCloudflareExecutors } from "../cloudflare.ts";
import type { CreateZoneRecord, DeleteZoneRecord } from "../cloudflare.ts";
import { type CreateUnit, type SkipUnit, Type } from "../../../types/plan.ts";
import type { CloudflareClient } from "../../../clients/cloudflare.ts";
import type { GitInfo } from "../../../clients/git.ts";
import type {
  CloudflareDNSRecord,
  CloudflareDNSRecordState,
  CloudflareDNSZones,
  CloudflareZonesState,
} from "../../types.ts";
import type { UpdateUnit } from "../../../types/plan.ts";
import type { UpdateZoneRecord } from "../cloudflare.ts";
import type { DeleteUnit } from "../../../types/plan.ts";
import type { MigrationUnit } from "../../../types/plan.ts";
import type { NoopUnit } from "../../../types/plan.ts";

const executors = createCloudflareExecutors(
  {} as unknown as CloudflareClient,
);

describe("cloudflare dsn", () => {
  describe("create new record", () => {
    it("should create bucket for new config on default branch", async () => {
      const git = {
        defaultBranch: "master",
        branchName: "master",
      } as GitInfo;

      const recordConfig = {
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
      };
      const config: CloudflareDNSZones = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordConfig,
          },
        },
      };
      const state: CloudflareZonesState = {};

      const result = await createCloudflareDNSPlan(
        executors,
        git,
        state,
        config,
      );

      const create: CreateUnit<CloudflareDNSRecord, CloudflareDNSRecordState, CreateZoneRecord> = {
        type: Type.Create,
        executor: executors.createZoneRecord,
        args: ["golde.dev", "A", "dns-cloudflare", recordConfig],
        path: "dns.cloudflare.golde.dev.A.dns-cloudflare",
        dependencies: [],
        config: recordConfig,
      };
      expect(result).toEqual([create]);
    });

    it("should skip record creation if branch is different", async () => {
      const git = {
        defaultBranch: "master",
        branchName: "develop",
      } as GitInfo;

      const recordConfig = {
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
      };
      const config: CloudflareDNSZones = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordConfig,
          },
        },
      };

      const state: CloudflareZonesState = {};

      const result = await createCloudflareDNSPlan(
        executors,
        git,
        state,
        config,
      );

      const skip: SkipUnit<CloudflareDNSRecord, CloudflareDNSRecordState> = {
        type: Type.Skip,
        path: "dns.cloudflare.golde.dev.A.dns-cloudflare",
        config: recordConfig,
      };

      expect(result).toEqual([skip]);
    });
  });

  describe("update record", () => {
    it("should update record for new config on default branch", async () => {
      const git = {
        defaultBranch: "master",
        branchName: "master",
      } as GitInfo;

      const prevRecordConfig = {
        branch: "master",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
      };
      const updatedRecordConfig = {
        branch: "master",
        value: "20.10.10.2",
        ttl: 600,
        proxied: false,
      };
      const config: CloudflareDNSZones = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": updatedRecordConfig,
          },
        },
      };

      const recordState = {
        id: "1234",
        zoneId: "456",
        modifiedAt: "2022-01-01T00:00:00.000Z",
        createdAt: "2022-01-01T00:00:00.000Z",
        value: "20.10.10.2",
        ttl: 3600,
        proxied: false,
        config: prevRecordConfig,
      };

      const state: CloudflareZonesState = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordState,
          },
        },
      };

      const result = await createCloudflareDNSPlan(
        executors,
        git,
        state,
        config,
      );

      const update: UpdateUnit<CloudflareDNSRecord, CloudflareDNSRecordState, UpdateZoneRecord> = {
        type: Type.Update,
        executor: executors.updateZoneRecord,
        args: ["golde.dev", "A", "dns-cloudflare", "1234", updatedRecordConfig],
        path: "dns.cloudflare.golde.dev.A.dns-cloudflare",
        dependencies: [],
        state: recordState,
        config: updatedRecordConfig,
      };
      expect(result).toEqual([update]);
    });

    it("should skip record update if branch is different", async () => {
      const git = {
        defaultBranch: "master",
        branchName: "develop",
      } as GitInfo;

      const prevRecordConfig = {
        branch: "master",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
      };
      const updatedRecordConfig = {
        branch: "master",
        value: "20.10.10.2",
        ttl: 600,
        proxied: false,
      };
      const config: CloudflareDNSZones = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": updatedRecordConfig,
          },
        },
      };

      const recordState = {
        id: "1234",
        zoneId: "1234",
        modifiedAt: "2022-01-01T00:00:00.000Z",
        createdAt: "2022-01-01T00:00:00.000Z",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
        config: prevRecordConfig,
      };

      const state: CloudflareZonesState = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordState,
          },
        },
      };

      const result = await createCloudflareDNSPlan(
        executors,
        git,
        state,
        config,
      );

      const skip: SkipUnit<CloudflareDNSRecord, CloudflareDNSRecordState> = {
        type: Type.Skip,
        path: "dns.cloudflare.golde.dev.A.dns-cloudflare",
        config: updatedRecordConfig,
        state: recordState,
      };

      expect(result).toEqual([skip]);
    });
  });

  describe("delete record", () => {
    it("should delete record for new config on default branch", async () => {
      const git = {
        defaultBranch: "master",
        branchName: "master",
      } as GitInfo;

      const config: CloudflareDNSZones = {};

      const recordConfig = {
        branch: "master",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
      };

      const recordState = {
        id: "1234",
        zoneId: "456",
        modifiedAt: "2022-01-01T00:00:00.000Z",
        createdAt: "2022-01-01T00:00:00.000Z",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
        config: recordConfig,
      };

      const state: CloudflareZonesState = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordState,
          },
        },
      };

      const result = await createCloudflareDNSPlan(
        executors,
        git,
        state,
        config,
      );

      const deleteUnit: DeleteUnit<CloudflareDNSRecordState, DeleteZoneRecord> = {
        type: Type.Delete,
        executor: executors.deleteZoneRecord,
        args: ["golde.dev", "1234"],
        path: "dns.cloudflare.golde.dev.A.dns-cloudflare",
        dependencies: [],
        state: recordState,
      };

      expect(result).toEqual([deleteUnit]);
    });

    it("should skip record delete if branch is different", async () => {
      const git = {
        defaultBranch: "master",
        branchName: "develop",
      } as GitInfo;

      const config: CloudflareDNSZones = {};

      const recordConfig = {
        branch: "master",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
      };

      const recordState = {
        id: "1234",
        zoneId: "456",
        modifiedAt: "2022-01-01T00:00:00.000Z",
        createdAt: "2022-01-01T00:00:00.000Z",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
        config: recordConfig,
      };

      const state: CloudflareZonesState = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordState,
          },
        },
      };

      const result = await createCloudflareDNSPlan(
        executors,
        git,
        state,
        config,
      );

      const skip: SkipUnit<CloudflareDNSRecord, CloudflareDNSRecordState> = {
        type: Type.Skip,
        path: "dns.cloudflare.golde.dev.A.dns-cloudflare",
        state: recordState,
      };

      expect(result).toEqual([skip]);
    });
  });

  describe("migrate record", () => {
    it("should move record to different branch state, running on prev branch", async () => {
      const git = {
        defaultBranch: "master",
        branchName: "master",
      } as GitInfo;

      const prevRecordConfig = {
        branch: "master",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
      };
      const updatedRecordConfig = {
        branch: "develop",
        value: "20.10.10.1",
        ttl: 600,
        proxied: false,
      };
      const config: CloudflareDNSZones = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": updatedRecordConfig,
          },
        },
      };

      const recordState = {
        id: "1234",
        zoneId: "456",
        modifiedAt: "2022-01-01T00:00:00.000Z",
        createdAt: "2022-01-01T00:00:00.000Z",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
        config: prevRecordConfig,
      };

      const state: CloudflareZonesState = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordState,
          },
        },
      };

      const result = await createCloudflareDNSPlan(
        executors,
        git,
        state,
        config,
      );

      const migration: MigrationUnit = {
        type: Type.Migrate,
        from: "master",
        to: "develop",
        path: "dns.cloudflare.golde.dev.A.dns-cloudflare",
      };
      expect(result).toEqual([migration]);
    });

    it("should move record to different branch state, running on new branch", async () => {
      const git = {
        defaultBranch: "master",
        branchName: "develop",
      } as GitInfo;

      const prevRecordConfig = {
        branch: "master",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
      };
      const updatedRecordConfig = {
        branch: "develop",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
      };
      const config: CloudflareDNSZones = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": updatedRecordConfig,
          },
        },
      };

      const recordState = {
        id: "1234",
        zoneId: "456",
        modifiedAt: "2022-01-01T00:00:00.000Z",
        createdAt: "2022-01-01T00:00:00.000Z",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
        config: prevRecordConfig,
      };

      const state: CloudflareZonesState = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordState,
          },
        },
      };

      const result = await createCloudflareDNSPlan(
        executors,
        git,
        state,
        config,
      );
      const migration: MigrationUnit = {
        type: Type.Migrate,
        from: "master",
        to: "develop",
        path: "dns.cloudflare.golde.dev.A.dns-cloudflare",
      };

      expect(result).toEqual([migration]);
    });

    it("should update only when config is different and branch is different", async () => {
      const git = {
        defaultBranch: "master",
        branchName: "master",
      } as GitInfo;

      const prevRecordConfig = {
        branch: "master",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
      };
      const updatedRecordConfig = {
        branch: "develop",
        value: "20.10.10.2",
        ttl: 600,
        proxied: false,
      };

      const config: CloudflareDNSZones = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": updatedRecordConfig,
          },
        },
      };

      const recordState = {
        id: "1234",
        zoneId: "456",
        modifiedAt: "2022-01-01T00:00:00.000Z",
        createdAt: "2022-01-01T00:00:00.000Z",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
        config: prevRecordConfig,
      };

      const state: CloudflareZonesState = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordState,
          },
        },
      };

      const result = await createCloudflareDNSPlan(
        executors,
        git,
        state,
        config,
      );

      const update: UpdateUnit<CloudflareDNSRecord, CloudflareDNSRecordState, UpdateZoneRecord> = {
        type: Type.Update,
        executor: executors.updateZoneRecord,
        args: ["golde.dev", "A", "dns-cloudflare", "1234", updatedRecordConfig],
        path: "dns.cloudflare.golde.dev.A.dns-cloudflare",
        dependencies: [],
        state: recordState,
        config: updatedRecordConfig,
      };

      expect(result).toEqual([update]);
    });

    it("should not move record if running on different branch than from/to", async () => {
      const git = {
        defaultBranch: "master",
        branchName: "test",
      } as GitInfo;

      const prevRecordConfig = {
        branch: "master",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
      };
      const updatedRecordConfig = {
        branch: "develop",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
      };
      const config: CloudflareDNSZones = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": updatedRecordConfig,
          },
        },
      };

      const recordState = {
        id: "1234",
        zoneId: "456",
        modifiedAt: "2022-01-01T00:00:00.000Z",
        createdAt: "2022-01-01T00:00:00.000Z",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
        config: prevRecordConfig,
      };

      const state: CloudflareZonesState = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordState,
          },
        },
      };

      const result = await createCloudflareDNSPlan(
        executors,
        git,
        state,
        config,
      );

      const skip: SkipUnit<CloudflareDNSRecord, CloudflareDNSRecordState> = {
        type: Type.Skip,
        path: "dns.cloudflare.golde.dev.A.dns-cloudflare",
        config: updatedRecordConfig,
        state: recordState,
      };
      expect(result).toEqual([skip]);
    });
  });

  describe("noop changes on record", () => {
    it("when state and config are the same", async () => {
      const git = {
        defaultBranch: "master",
        branchName: "master",
      } as GitInfo;

      const prevRecordConfig = {
        branch: "master",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
      };
      const config: CloudflareDNSZones = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": prevRecordConfig,
          },
        },
      };
      const recordState = {
        id: "1234",
        zoneId: "456",
        modifiedAt: "2022-01-01T00:00:00.000Z",
        createdAt: "2022-01-01T00:00:00.000Z",
        value: "20.10.10.1",
        ttl: 3600,
        proxied: false,
        config: prevRecordConfig,
      };
      const state: CloudflareZonesState = {
        "golde.dev": {
          "A": {
            "dns-cloudflare": recordState,
          },
        },
      };

      const result = await createCloudflareDNSPlan(
        executors,
        git,
        state,
        config,
      );

      const noop: NoopUnit<CloudflareDNSRecord, CloudflareDNSRecordState> = {
        type: Type.Noop,
        path: "dns.cloudflare.golde.dev.A.dns-cloudflare",
        config: prevRecordConfig,
        state: recordState,
      };

      expect(result).toEqual([noop]);
    });
  });
});
