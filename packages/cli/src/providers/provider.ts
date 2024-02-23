/* eslint-disable @typescript-eslint/no-extraneous-class */

export interface ProvidersConfig {
  /**
   * Cloudflare provider config
   */
  cloudflare?: {
    /**
     * Cloudflare API token 
     * @see https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
     */
    apiKey: string
  }
  /**
   * Cloudflare provider config
   */
  hetzner?: {
    /**
     * Hetzner API token 
     * @see https://docs.hetzner.com/cloud/api/getting-started/generating-api-token/
     */
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

export abstract class Provider {
  public static init: <T>(config: unknown) => Promise<T>;
}
