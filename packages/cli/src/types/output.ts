export interface FileOutput {
  type: "file";
  format: "json" | "yaml" | "toml";
  path: string;
  data: Record<string, unknown>;
}

export interface HttpOutput {
  type: "http";
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  data: Record<string, unknown>;
}

export type Output = FileOutput | HttpOutput;
