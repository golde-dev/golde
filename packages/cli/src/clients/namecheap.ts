export class NameCheapClient {
  private readonly apiKey: string;
  private readonly apiUser: string;

  public constructor(apiKey: string, apiUser: string) {
    this.apiKey = apiKey;
    this.apiUser = apiUser;
  }

  public verifyUserToken() {
    return Promise.resolve({});
  }
}
