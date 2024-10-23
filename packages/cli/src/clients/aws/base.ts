export class AWSClientBase {
  protected readonly accessKeyId: string;
  protected readonly secretAccessKey: string;

  constructor(accessKeyId: string, secretAccessKey: string) {
    this.accessKeyId = accessKeyId;
    this.secretAccessKey = secretAccessKey;
  }

  public verifyCredentials(): Promise<void> {
    return Promise.resolve();
  }
}
