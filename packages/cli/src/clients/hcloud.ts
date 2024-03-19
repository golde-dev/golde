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

interface ErrorResult {
  error: {
    code: string;
    message: string; 
    details: ErrorDetails
  }
}

export interface ErrorDetails {
  code: string;
  message: string;
  details: ErrorDetails
}

export interface HCloudErrorCause {
  code: string;
  message: string; 
  details: ErrorDetails
}

export interface ErrorCause {
  status: number;
  statusText: string
}


export class HCloudError extends Error {
  public constructor(message: string, cause: ErrorCause | HCloudErrorCause) {
    super(message, {cause});
  }
}

export class HCloudClient {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.hetzner.cloud/v1";

  public constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest<T extends object>(path: string, body?: BodyInit): Promise<T> {
    return fetch(`${this.baseUrl}/${path}`, {
      body,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    }).then(d => {
      const result = d.json() as ErrorResult | T;
      if (!d.ok) {
        throw new HCloudError("Request failed", {
          status: d.status,
          statusText: d.statusText,
        });
      }
      if ("error" in result) {
        throw new HCloudError("Request failed", result.error);
      }
      return result;
    });
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