import { z } from "zod";

export const slackCredentialsSchema = z.object({
  apiToken: z.string().describe("Slack API token"),
});
