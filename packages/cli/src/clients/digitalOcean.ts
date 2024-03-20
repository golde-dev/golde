


export class DigitalOceanClient {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.hetzner.cloud/v1";

  public constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

}