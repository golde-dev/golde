/* eslint-disable @typescript-eslint/no-extraneous-class */

export abstract class Provider {
  public static init: <T>(config: unknown) => Promise<T>;
}

export interface ProvidersConfig{
  /**
   * Cloudflare provider config
   */
  cloudflare?: {
    apiKey: string
  }
  /**
   * State provider, only required if not using payed offering
   */
  state?: {
    bucket: string, 
    region: string,
    endpoint: string,
    accessKeyId: string,
    secretAccessKey: string,
  }
}