import type { AWSConfig } from "./aws.ts";
import type { CloudflareConfig } from "./cloudflare.ts";
import type { GoldeConfig } from "./golde.ts";
import type { DockerConfig } from "./docker.ts";

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
