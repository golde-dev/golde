import { stringify } from "querystring";

/**
 * @see https://docs.hetzner.cloud/#locations-get-all-locations
 */
interface Location {
  "city": string,
  "country": string,
  "description": string,
  "id": number,
  "latitude": number
  "longitude": number,
  "name": string,
  "network_zone": string
}

export class HCloudClient {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.hetzner.cloud/v1";

  public constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(path: string, body?: BodyInit): Promise<T> {
    return fetch(`${this.baseUrl}/${path}`, {
      body,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    }).then(d => d.json() as T);
  }

  public async verifyUserToken(): Promise<void> {
    await this.getLocations();
  }

  public async getLocations(): Promise<Location[]> {
    const query = stringify({
      per_page: 200,
    });
    return this.makeRequest<Location[]>(`/locations?${query}`);
  }
}