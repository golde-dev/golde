import { logger } from "@/logger.ts";

interface FetchErrorCause {
  url: string;
  status: number;
  statusText: string;
}

export class GithubError extends Error {
  public constructor(message: string, cause?: FetchErrorCause | unknown) {
    super(message, { cause });
    this.cause = cause;
  }
}

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

  protected makeRequest<T>(
    path: string,
    method = "GET",
    body?: object,
  ): Promise<T> {
    logger.debug({
      path,
      method,
    }, "[GitHub] request");

    return fetch(`${this.baseUrl}${path}`, {
      method,
      body: body ? JSON.stringify(body) : undefined,
      headers: {
        "Authorization": `Bearer ${this.accessToken}`,
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }).then(async (r) => {
      if (!r.ok) {
        throw new GithubError("GitHub API request failed", {
          url: r.url,
          status: r.status,
          statusText: r.statusText,
        });
      }
      if (r.status === 204) return null as T;
      return await r.json() as T;
    }).catch((error) => {
      if (error instanceof GithubError) throw error;
      throw new GithubError("GitHub API request failed", error);
    });
  }
}
