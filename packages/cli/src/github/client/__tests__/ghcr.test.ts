import { expect } from "@std/expect/expect";
import { afterEach, beforeEach, describe, it } from "@std/testing/bdd";
import { type Stub, stub } from "@std/testing/mock";
import { GithubClient } from "../client.ts";

type Route = (url: URL, method: string) => Response | undefined;

function version(id: number, tags: string[]) {
  return { id, name: `sha256:${id}`, metadata: { container: { tags } } };
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

describe("GhcrClient", () => {
  const client = new GithubClient("chyzwar", "token");
  const requests: string[] = [];
  let route: Route = () => undefined;
  let fetchStub: Stub<typeof globalThis, Parameters<typeof fetch>, Promise<Response>>;

  beforeEach(() => {
    requests.length = 0;
    route = () => undefined;
    fetchStub = stub(globalThis, "fetch", (input, init) => {
      const request = new Request(input, init);
      const url = new URL(request.url);
      requests.push(`${request.method} ${url.pathname}${url.search}`);
      return Promise.resolve(route(url, request.method) ?? json({ message: "Not Found" }, 404));
    });
  });

  afterEach(() => fetchStub.restore());

  it("should delete a version of an org-owned image through the org packages api", async () => {
    route = (url, method) => {
      if (
        method === "GET" && url.pathname === "/orgs/sancho-wms/packages/container/api-dev/versions"
      ) {
        return json([version(1, ["latest"]), version(2, ["develop-ih-old"])]);
      }
      if (
        method === "DELETE" &&
        url.pathname === "/orgs/sancho-wms/packages/container/api-dev/versions/2"
      ) {
        return new Response(null, { status: 204 });
      }
    };

    await client.deletePackageVersion("sancho-wms/api-dev", "develop-ih-old");

    expect(requests).toEqual([
      "GET /orgs/sancho-wms/packages/container/api-dev/versions?per_page=100&page=1",
      "DELETE /orgs/sancho-wms/packages/container/api-dev/versions/2",
    ]);
  });

  it("should use the user packages api when the owner is the authenticated user", async () => {
    route = (url) => {
      if (url.pathname === "/user/packages/container/app") {
        return json({ name: "app" });
      }
    };

    expect(await client.packageExists("Chyzwar/app")).toBe(true);
  });

  it("should keep nested package names as one encoded segment", async () => {
    route = (url) => {
      if (url.pathname === "/orgs/acme/packages/container/team%2Fapp") {
        return json({ name: "team/app" });
      }
    };

    expect(await client.packageExists("acme/team/app")).toBe(true);
  });

  it("should page through versions until the tag is found", async () => {
    route = (url) => {
      const page = Number(url.searchParams.get("page"));
      if (page === 1) {
        return json(Array.from({ length: 100 }, (_, i) => version(i, [`old-${i}`])));
      }
      if (page === 2) {
        return json([version(500, ["wanted"])]);
      }
    };

    expect(await client.packageVersionExists("acme/app", "wanted")).toBe(true);
    expect(requests).toHaveLength(2);
  });

  it("should stop paging at a short page when the tag is missing", async () => {
    route = () => json([version(1, ["latest"])]);

    expect(await client.packageVersionExists("acme/app", "wanted")).toBe(false);
    expect(requests).toHaveLength(1);
  });

  it("should report a missing package as not existing", async () => {
    expect(await client.packageExists("acme/app")).toBe(false);
    expect(await client.packageVersionExists("acme/app", "latest")).toBe(false);
  });

  it("should reject an image name without an owner", async () => {
    await expect(client.packageExists("app")).rejects.toThrow("<owner>/<package>");
  });
});
