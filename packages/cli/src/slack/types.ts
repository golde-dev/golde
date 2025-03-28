import type { MessagesConfig } from "./outputs/channel/message/types.ts";

export interface SlackCredentials {
  apiToken: string;
}

export interface SlackOutputConfig {
  channel: {
    message: MessagesConfig;
  };
}
