export interface S3StateConfig {
  type: "s3";
  bucket: string;
  region: string;
  endpoint: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export interface FSStateConfig {
  type: "fs";
  path?: string;
}

export type StateConfig = S3StateConfig | FSStateConfig;
