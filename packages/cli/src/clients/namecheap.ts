/* eslint-disable @typescript-eslint/class-methods-use-this */
// https://www.namecheap.com/support/api/methods/domains-dns/set-hosts/


export class NameCheapClient {
  private readonly apiKey: string;
  private readonly apiUser: string;

  public constructor(apiKey: string, apiUser: string) {
    this.apiKey = apiKey;
    this.apiUser = apiUser;
  }

  public async verifyUserToken() {
    return Promise.resolve({});
  }
}