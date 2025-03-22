export class GithubClientBase {
  protected readonly username: string;
  protected readonly accessToken: string;
  protected readonly baseUrl = "https://api.github.com";

  public constructor(username: string, accessToken: string) {
    this.username = username;
    this.accessToken = accessToken;
  }

  public getCredentials() {
    return {
      username: this.username,
      accessToken: this.accessToken,
    };
  }

  public async verifyUserToken() {
  }
}
