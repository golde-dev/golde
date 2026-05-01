import ky, { HTTPError, type KyInstance } from "ky";
import { logger } from "@/logger.ts";
import { get } from "es-toolkit/compat";

interface FetchErrorCause {
  url: string;
  status: number;
  statusText: string;
  body?: unknown;
}

export function getFetchErrorCause(error: unknown): FetchErrorCause | undefined {
  if (error instanceof HTTPError) {
    const { response, request } = error;
    return {
      url: request.url,
      status: response.status,
      statusText: response.statusText,
      body: response.body,
    };
  }
  return;
}

export function getErrorStatus(error: unknown): number | undefined {
  if (error instanceof Error) {
    return get(error, "cause.status");
  }
}

export class GithubError extends Error {
  override cause?: FetchErrorCause;
  public constructor(message: string, cause?: FetchErrorCause) {
    super(message, { cause });
    this.cause = cause;
  }
}

export class GithubClientBase {
  protected readonly username: string;
  protected readonly accessToken: string;
  protected readonly api: KyInstance;

  public constructor(username: string, accessToken: string) {
    this.username = username;
    this.accessToken = accessToken;

    this.api = ky.create({
      baseUrl: "https://api.github.com/",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      hooks: {
        beforeRequest: [
          ({ request }) => {
            logger.debug(
              { url: request.url, method: request.method },
              "[GitHub] request",
            );
          },
        ],
      },
    });
  }

  public getCredentials() {
    return {
      username: this.username,
      accessToken: this.accessToken,
    };
  }

  /**
   * GitHub has no token-verification endpoint dedicated for this purpose;
   * auth is validated lazily on the first authenticated request.
   */
  public verifyUserToken(): Promise<void> {
    return Promise.resolve();
  }
}
