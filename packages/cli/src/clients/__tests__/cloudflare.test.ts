import { afterEach, describe, expect, it, vi } from "vitest";
import { CloudflareClient } from "../cloudflare";

global.fetch = vi.fn();
function createFetchResponse(data: unknown): Response {
  return {
    ok: true,
    json: async() => new Promise((resolve) => {
      resolve(data); 
    }), 
  } as Response;
}

describe("CloudflareClient", () => {
  const client = new CloudflareClient("apiToken", "accountId");

  describe("verifyUserToken", () => {
    afterEach(() => {
      vi.mocked(global.fetch).mockReset();
    });

    it("should verify user token", async() => {
      const mockResponse = {result: { status: "active" }, success: true};
      vi.mocked(fetch).mockResolvedValue(createFetchResponse(mockResponse));

      await client.verifyUserToken();

      expect(fetch).toHaveBeenCalledWith("https://api.cloudflare.com/client/v4//user/tokens/verify", {
        "body": undefined,
        "headers":  {
          "Authorization": "Bearer apiToken",
          "Content-Type": "application/json",
        },
        "method": "GET", 
      });
    });

    it("should throw an error if token is not active", async() => {
      const mockResponse = {result: { status: "inactive"}, success: true};
      vi.mocked(fetch).mockResolvedValue(createFetchResponse(mockResponse));

      await expect(client.verifyUserToken()).rejects.toThrowError(
        "Token is not active: inactive"
      );
    });
  });
});