import { assertEquals } from "@std/assert";
import { createCloudflareDNSPlan } from "../cloudflare.ts";
import type { CloudflareProvider } from "../../../providers/cloudflare.ts";
import { Type } from "../../../types/plan.ts";

Deno.test("createCloudflareDNSPlan", async (t) => {
  const mockProvider = {
    updateZoneRecord: () => {},
    createZoneRecord: () => {},
    deleteZoneRecord: () => {},
  } as unknown as CloudflareProvider;

  await t.step("add new records", () => {
    const nextConfig = {
      "deployer.dev": {
        "A": {
          "dns-cloudflare": {
            value: "20.10.10.1",
            ttl: 3600,
            proxied: false,
          },
        },
      },
    };

    assertEquals(
      createCloudflareDNSPlan(mockProvider, undefined, undefined, nextConfig),
      [
        {
          "args": [
            "deployer.dev",
            {
              "comment": undefined,
              "content": "20.10.10.1",
              "name": "dns-cloudflare",
              "proxied": false,
              "tags": undefined,
              "ttl": 3600,
              "type": "A",
            },
          ],
          "dependencies": [],
          "executor": mockProvider.createZoneRecord,
          "path": "dns.cloudflare.deployer.dev.A.dns-cloudflare",
          "type": Type.Create,
        },
      ],
    );
  });

  await t.step("delete records", () => {
    const prevConfig = {
      "deployer.dev": {
        "A": {
          "dns-cloudflare": {
            value: "20.10.10.1",
            ttl: 3600,
            proxied: false,
          },
        },
      },
    };
    const prevState = {
      "deployer.dev": {
        "A": {
          "dns-cloudflare": {
            id: "cloudflare id",
            value: "20.10.10.1",
            zone_id: "1",
            modified_on: "",
            created_on: "",
            ttl: 3600,
            proxied: false,
          },
        },
      },
    };
    const nextConfig = undefined;
    assertEquals(
      createCloudflareDNSPlan(mockProvider, prevConfig, prevState, nextConfig),
      [
        {
          "args": [
            "deployer.dev",
            "cloudflare id",
          ],
          "dependencies": [],
          "executor": mockProvider.deleteZoneRecord,
          "path": "dns.cloudflare.deployer.dev.A.dns-cloudflare",
          "type": Type.Delete,
        },
      ],
    );
  });

  await t.step("update records", () => {
    const prevConfig = {
      "deployer.dev": {
        "A": {
          "dns-cloudflare": {
            value: "20.10.10.1",
            ttl: 3600,
            proxied: false,
          },
        },
      },
    };
    const prevState = {
      "deployer.dev": {
        "A": {
          "dns-cloudflare": {
            id: "cloudflare id",
            value: "20.10.10.1",
            zone_id: "1",
            modified_on: "",
            created_on: "",
            ttl: 3600,
            proxied: false,
          },
        },
      },
    };
    const nextConfig = {
      "deployer.dev": {
        "A": {
          "dns-cloudflare": {
            value: "20.10.10.10",
            ttl: 3600,
            proxied: false,
          },
        },
      },
    };
    assertEquals(
      createCloudflareDNSPlan(mockProvider, prevConfig, prevState, nextConfig),
      [
        {
          "args": [
            "deployer.dev",
            "cloudflare id",
            {
              "comment": undefined,
              "content": "20.10.10.10",
              "name": "dns-cloudflare",
              "proxied": false,
              "tags": undefined,
              "ttl": 3600,
              "type": "A",
            },
          ],
          "dependencies": [],
          "executor": mockProvider.updateZoneRecord,
          "path": "dns.cloudflare.deployer.dev.A.dns-cloudflare",
          "type": Type.Create,
        },
      ],
    );
  });
});
