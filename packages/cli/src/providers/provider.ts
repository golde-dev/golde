/* eslint-disable @typescript-eslint/no-extraneous-class */

export interface ProvidersConfig {
  /**
   * Hetzner cloud provider config
   */
  deployer?: {
    /**
     * Deployer API token 
     */
    apiKey: string
  }
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
   * Hetzner cloud provider config
   */
  hcloud?: {
    /**
     * Hetzner API token 
     * @see https://docs.hetzner.com/cloud/api/getting-started/generating-api-token/
     */
    apiKey: string
  }
  /**
   * State provider, only required if not using payed offering
   * State provider would store build artifacts and state of project
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
