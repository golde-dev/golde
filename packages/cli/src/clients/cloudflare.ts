


export class CloudflareClient {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.cloudflare.com/client/v4";

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
    return this.makeRequest<void>("/user/tokens/verify");
  }

}