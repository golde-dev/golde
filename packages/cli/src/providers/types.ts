export interface GoldeConfig {
  /**
   * Golde API token
   */
  apiKey: string;
}

export interface AWSConfig {
  /**
   * AWS region to use when managing aws resources
   */
  region?: string;
  /**
   * AWS access key id
   */
  accessKeyId: string;
  /**
   * AWS secret access key
   */
  secretAccessKey: string;
}

export interface CloudflareConfig {
  /**
   * Cloudflare API token
   * @see https://developers.cloudflare.com/fundamentals/api/get-started/create-token/
   */
  apiToken: string;
  /**
   * Cloudflare account id
   * @see https://developers.cloudflare.com/fundamentals/setup/find-account-and-zone-ids
   */
  accountId: string;
}

export interface DockerConfig {
  /**
   * Docker registry url
   */
  registry: string;
  /**
   * Docker username
   */
  username: string;
  /**
   * Docker password
   */
  password: string;
}

export interface ProvidersConfig {
  /**
   * Golde provider config
   */
  golde?: GoldeConfig;
  aws?: AWSConfig;
  docker?: DockerConfig;
  /**
   * Cloudflare provider config
   */
  cloudflare?: CloudflareConfig;
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
}
