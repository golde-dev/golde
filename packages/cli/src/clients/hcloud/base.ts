import { logger } from "../../logger.ts";

interface ResultBase {
  error?: {
    code: string;
    message: string;
    details: ErrorDetails;
  };
  meta?: object;
}

interface ErrorDetails {
  code: string;
  message: string;
  details: ErrorDetails;
}

interface ErrorCause {
  code: string;
  message: string;
  details: ErrorDetails;
}

interface FetchErrorCause {
  status: number;
  statusText: string;
}

export class HCloudError extends Error {
  public constructor(message: string, cause: ErrorCause | FetchErrorCause) {
    super(message, { cause });
  }
}

export class HCloudClientBase {
  protected readonly apiKey: string;
  protected readonly baseUrl = "https://api.hetzner.cloud/v1";

  public constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  protected makeRequest<T extends ResultBase>(
    path: string,
    method = "GET",
    body?: BodyInit,
  ): Promise<Omit<T, "error" | "meta">> {
    const start = Date.now();
    return fetch(`${this.baseUrl}/${path}`, {
      body,
      method,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    }).then(async (d) => {
      if (!d.ok) {
        throw new HCloudError("Request failed", {
          status: d.status,
          statusText: d.statusText,
        });
      }
      const { error, meta: _, ...rest } = await d.json() as T;
      if (error) {
        throw new HCloudError("Request failed", error);
      }
      return rest;
    }).finally(() => {
      const end = Date.now();
      logger.debug("Completed hetzner request", {
        path,
        method,
        body,
        time: end - start,
      });
    });
  }

  public async verifyUserToken(): Promise<void> {
  }
}
