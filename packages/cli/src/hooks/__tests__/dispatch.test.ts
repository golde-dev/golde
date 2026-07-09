import { describe, it } from "@std/testing/bdd";
import { expect } from "@std/expect/expect";
import { stub } from "@std/testing/mock";
import { dispatchHooks, matchesBranch } from "../dispatch.ts";
import type { Context } from "@/types/context.ts";
import type { On, RunInfo } from "../types.ts";

const run: RunInfo = {
  status: "success",
  command: "apply",
  duration: "1.2s",
  changes: "1 created",
};

const createContext = (on: On, branchName = "master"): Context =>
  ({
    config: { name: "project", on },
    git: { branchName, branchSlug: branchName.replaceAll("/", "-") },
  }) as Context;

const stubFetch = (responses: Array<{ url: string; init?: RequestInit }>) =>
  stub(
    globalThis,
    "fetch",
    (input: URL | RequestInfo, init?: RequestInit) => {
      responses.push({ url: String(input), init });
      return Promise.resolve(new Response("{}", { status: 200 }));
    },
  );

describe("matchesBranch", () => {
  it("should match everything when no branch fields are set", () => {
    expect(matchesBranch({}, "master")).toBe(true);
  });

  it("should match exact branch names", () => {
    expect(matchesBranch({ branch: "master" }, "master")).toBe(true);
    expect(matchesBranch({ branch: "master" }, "feature/x")).toBe(false);
  });

  it("should match branch patterns", () => {
    expect(matchesBranch({ branchPattern: "feature/.*" }, "feature/x")).toBe(true);
    expect(matchesBranch({ branchPattern: "feature/.*" }, "master")).toBe(false);
  });
});

describe("dispatchHooks", () => {
  it("should post resolved discord messages", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    using _fetch = stubFetch(requests);

    const context = createContext({
      success: [
        {
          discord: {
            webhook: "https://discord.example.com/webhook",
            message: "{{ run.status }}: {{ outputs.apiUrl }} ({{ run.changes }})",
          },
        },
      ],
    });

    await dispatchHooks(context, ["success"], run, { apiUrl: "https://api.example.com" }, []);

    expect(requests).toHaveLength(1);
    expect(requests[0]?.url).toBe("https://discord.example.com/webhook");
    expect(requests[0]?.init?.method).toBe("POST");
    expect(JSON.parse(String(requests[0]?.init?.body))).toEqual({
      content: "success: https://api.example.com (1 created)",
    });
  });

  it("should post default webhook payload", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    using _fetch = stubFetch(requests);

    const context = createContext({
      failure: [{ webhook: { url: "https://ops.example.com/hook" } }],
    });
    const failedRun: RunInfo = { ...run, status: "failure", error: "boom" };

    await dispatchHooks(context, ["failure"], failedRun, {}, []);

    expect(requests).toHaveLength(1);
    expect(requests[0]?.init?.method).toBe("POST");
    expect(JSON.parse(String(requests[0]?.init?.body))).toEqual({
      project: "project",
      branch: "master",
      event: "failure",
      run: failedRun,
      outputs: {},
    });
  });

  it("should honor webhook method, headers and body overrides", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    using _fetch = stubFetch(requests);

    const context = createContext({
      success: [
        {
          webhook: {
            url: "https://ops.example.com/hook",
            method: "PUT",
            headers: { "X-Token": "abc" },
            body: "status={{ run.status }}",
          },
        },
      ],
    });

    await dispatchHooks(context, ["success"], run, {}, []);

    expect(requests[0]?.init?.method).toBe("PUT");
    expect(new Headers(requests[0]?.init?.headers).get("X-Token")).toBe("abc");
    expect(String(requests[0]?.init?.body)).toBe("status=success");
  });

  it("should skip actions scoped to other branches", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    using _fetch = stubFetch(requests);

    const context = createContext({
      success: [
        {
          discord: { webhook: "https://discord.example.com/master", message: "x" },
          branch: "master",
        },
        {
          discord: { webhook: "https://discord.example.com/features", message: "x" },
          branchPattern: "feature/.*",
        },
      ],
    }, "feature/one");

    await dispatchHooks(context, ["success"], run, {}, []);

    expect(requests).toHaveLength(1);
    expect(requests[0]?.url).toBe("https://discord.example.com/features");
  });

  it("should run remaining actions when one fails", async () => {
    const requests: string[] = [];
    using _fetch = stub(
      globalThis,
      "fetch",
      (input: URL | RequestInfo) => {
        const url = String(input);
        requests.push(url);
        if (url.includes("bad")) {
          return Promise.resolve(new Response("nope", { status: 500 }));
        }
        return Promise.resolve(new Response("{}", { status: 200 }));
      },
    );

    const context = createContext({
      success: [
        { discord: { webhook: "https://discord.example.com/bad", message: "x" } },
        { discord: { webhook: "https://discord.example.com/good", message: "x" } },
      ],
    });

    await dispatchHooks(context, ["success"], run, {}, []);

    expect(requests).toHaveLength(2);
  });

  it("should not throw for slack actions without a slack client", async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    using _fetch = stubFetch(requests);

    const context = createContext({
      success: [{ slack: { channel: "#infra", text: "x" } }],
    });

    await dispatchHooks(context, ["success"], run, {}, []);

    expect(requests).toHaveLength(0);
  });
});
