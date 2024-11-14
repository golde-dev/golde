export interface FileOutput {
  type: "File";
  format: "json" | "yaml" | "toml";
  path: string;
  data: Record<string, unknown>;
}

export interface HttpOutput {
  type: "HTTP";
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  data: Record<string, unknown>;
}

export interface SlackOutput {
  type: "SlackChatMessage";
  channel: string;
  data: Record<string, unknown>;
}

export type Output = FileOutput | HttpOutput | SlackOutput;
