// import { assertRejects } from "@std/assert";
// import { assertSpyCall, stub } from "@std/testing/mock";
// import { CloudflareClient } from "../cloudflare.ts";

// function createFetchResponse(data: unknown): Response {
//   return {
//     ok: true,
//     json: () =>
//       new Promise((resolve) => {
//         resolve(data);
//       }),
//   } as Response;
// }

// Deno.test("CloudflareClient verifyUserToken", (t) => {
//   const client = new CloudflareClient("apiToken", "accountId");

//   t.step("should verify user token", async () => {
//     const mockResponse = { result: { status: "active" }, success: true };
//     stub(fetch).mockResolvedValue(createFetchResponse(mockResponse));

//     await client.verifyUserToken();

//     assertSpyCall(fetch, 0, {
//       args: [
//         "https://api.cloudflare.com/client/v4//user/tokens/verify",
//         {
//           "body": undefined,
//           "headers": {
//             "Authorization": "Bearer apiToken",
//             "Content-Type": "application/json",
//           },
//           "method": "GET",
//         },
//       ],
//     });
//   });

//   t.step("should throw an error if token is not active", async () => {
//     const mockResponse = { result: { status: "inactive" }, success: true };
//     stub(fetch).mockResolvedValue(createFetchResponse(mockResponse));

//     await assertRejects(
//       client.verifyUserToken(),
//       "Token is not active: inactive",
//     );
//   });
// });
