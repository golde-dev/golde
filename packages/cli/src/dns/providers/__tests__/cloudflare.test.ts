import { describe, expect, it, vi } from "vitest";
import { createCloudflareDNSPlan } from "../cloudflare";
import type { CloudflareProvider } from "../../../providers/cloudflare";

describe("createCloudflareDNSPlan", () => {


  const mockProvider = {
    updateZoneRecord: vi.fn(),
    createZoneRecord: vi.fn(),
    deleteZoneRecord: vi.fn(),
  } as unknown as CloudflareProvider;

  it("add new records", () => {
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
    
    expect(createCloudflareDNSPlan(mockProvider, undefined, undefined, nextConfig)).toEqual([
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
        "type": "Create",
      },
    ]);
  });

  it("delete records", () => {
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
    expect(createCloudflareDNSPlan(mockProvider, prevConfig, prevState, nextConfig)).toEqual( [
      {
        "args":  [
          "deployer.dev",
          "cloudflare id",
        ],
        "dependencies":  [],
        "executor": mockProvider.deleteZoneRecord,
        "path": "dns.cloudflare.deployer.dev.A.dns-cloudflare",
        "type": "Delete",
      },
    ]);
  });

  it("update records", () => {
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
    expect(createCloudflareDNSPlan(mockProvider, prevConfig, prevState, nextConfig)).toEqual([
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
        "type": "Create",
      },
    ]);
  });
});