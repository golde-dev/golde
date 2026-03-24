import { logger } from "../../logger.ts";
import { GOLDE_API_URL } from "../../version.ts";
import type { GoldeClientConfig } from "../types.ts";

interface GoldeErrorCause {
  url: string;
  status: number;
  statusText: string;
}

export class GoldeError extends Error {
  public override cause?: GoldeErrorCause;

  public constructor(message: string, cause?: GoldeErrorCause) {
    super(message);
    this.cause = cause;
  }
}

export function notFoundAsUndefined<T>(
  promise: Promise<T>,
): Promise<T | undefined> {
  return promise.catch((error: unknown) => {
    if (error instanceof GoldeError) {
      if (error.cause?.status === 404) {
        return undefined;
      }
    }
    throw error;
  });
}

export class GoldeClientBase {
  protected readonly apiKey: string;
  protected readonly baseUrl = GOLDE_API_URL;

  public constructor({apiKey}: GoldeClientConfig) {
    this.apiKey = apiKey;
  }

  protected makeRequest<T>(
    path: string,
    method = "GET",
    body?: object,
  ): Promise<T> {
    logger.debug({
      path,
      body,
      method,
    }, "[Golde] request");
    return fetch(`${this.baseUrl}${path}`, {
      method,
      body: JSON.stringify(body),
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    }).then(async (r) => {
      if (!r.ok) {
        throw new GoldeError(`Golde request failed`, {
          url: r.url,
          status: r.status,
          statusText: r.statusText,
        });
      }
      if (r.status === 204) {
        return null as T;
      }
      return await r.json() as T;
    }).catch((error) => {
      if (error instanceof GoldeError) {
        throw error;
      }
      throw new GoldeError(`Golde request failed`, error);
    });
  }

  protected makeFileRequest(
    path: string,
    method: "POST",
    body: FormData,
  ): Promise<void> {
    logger.debug({
      path,
      method: "GET",
    }, "[Golde] file request");
    return fetch(`${this.baseUrl}${path}`, {
      method,
      body,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
      },
    }).then((r) => {
      if (!r.ok) {
        throw new GoldeError(`Golde request failed`, {
          url: r.url,
          status: r.status,
          statusText: r.statusText,
        });
      }
    });
  }

  public async verifyUserToken(): Promise<void> {
    const { status } = await this.makeRequest<{ status: string }>(
      "/verify-token",
    );
    if (status !== "active") {
      throw new GoldeError(`Golde token status is not active: ${status}`);
    }
  }
}
