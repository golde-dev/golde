import type { ZoneRecordRequest } from "../clients/cloudflare";
import { CloudflareClient } from "../clients/cloudflare";
import type { CloudflareDNSRecordState } from "../dns/dns";
import logger from "../logger";
import type { Provider } from "./provider";

interface CloudflareConfig {
  apiToken: string
  accountId: string;
}

export class CloudflareProvider implements Provider {
  private readonly client: CloudflareClient;

  private constructor(client: CloudflareClient) {
    this.client = client;
  }

  public static async init({ apiToken, accountId }: CloudflareConfig): Promise<CloudflareProvider> {
    const client = new CloudflareClient(apiToken, accountId);

    try {
      logger.debug("Initializing cloudflare provider");
      await client.verifyUserToken();
      return new CloudflareProvider(client);
    }
    catch (error) {
      logger.error({
        error,
        apiKey: "<redacted>",
      }, "Failed to initialize cloudflare provider, check your apiKey and key policy");
      throw error;
    }
  }

  public createZoneRecord = async(zoneName: string, config: ZoneRecordRequest): Promise<CloudflareDNSRecordState> => {
    const {id, ttl, proxied, zone_id, modified_on, created_on, content: value} = await this.client.createZoneRecord(zoneName, config);

    return {
      id, 
      ttl, 
      proxied, 
      zone_id, 
      modified_on, 
      created_on, 
      value,
    };
  };

  public updateZoneRecord = async(zoneName: string, recordId: string, config: ZoneRecordRequest): Promise<CloudflareDNSRecordState> => {
    const {id, ttl, proxied, zone_id, modified_on, created_on, content: value} = await this.client.updateZoneRecord(zoneName, recordId, config);

    return {
      id, 
      ttl, 
      proxied, 
      zone_id, 
      modified_on, 
      created_on, 
      value,
    };
  };

  public deleteZoneRecord = async(zoneName: string, recordId: string): Promise<void> => {
    await this.client.deleteZoneRecord(zoneName, recordId);
  };
}

