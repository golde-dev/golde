export interface ProvidersConfig {
  /**
   * Golde provider config
   */
  golde?: {
    /**
     * Golde API token
     */
    apiKey: string;
  };
  /**
   * Cloudflare provider config
   */
  cloudflare?: {
    /**
     * Cloudflare API token
     * @see https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
     */
    apiToken: string;
    /**
     * Cloudflare account id https://developers.cloudflare.com/fundamentals/setup/find-account-and-zone-ids
     */
    accountId: string;
  };
  /**
   * Namecheap provider config
   */
  namecheap?: {
    /**
     * Hetzner API key
     * @see https://www.namecheap.com/support/api/intro/
     */
    apiKey: string;
    /**
     * Your Namecheap account username will act as API username
     */
    apiUser: string;
  };
  /**
   * Hetzner cloud provider config
   */
  hcloud?: {
    /**
     * Hetzner API token
     * @see https://docs.hetzner.com/cloud/api/getting-started/generating-api-token/
     */
    apiKey: string;
  };
  /**
   * State provider, only required if not using managed solution
   * State provider would store build artifacts and state of project
   */
  state?: {
    type: "s3";
    bucket: string;
    region: string;
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
  };
}

// eslint-disable-next-line @typescript-eslint/no-extraneous-class
export abstract class Provider {
  public static init: <T>(config: unknown) => Promise<T>;
}
