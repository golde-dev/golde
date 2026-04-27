import ky, { HTTPError, type KyInstance } from "ky";
import { logger } from "../../logger.ts";
import { retry } from "es-toolkit";
import { get } from "es-toolkit/compat";

interface ApiErrorDetails {
  code: string;
  message: string;
  details?: ApiErrorDetails;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ApiErrorDetails;
}

export interface ApiResponse {
  error?: ApiError;
  meta?: {
    pagination?: {
      page: number;
      per_page: number;
      previous_page: number | null;
      next_page: number | null;
      last_page: number;
      total_entries: number;
    };
  };
}

/**
 * @see https://docs.hetzner.cloud/reference/cloud#actions
 */
export interface Action {
  id: number;
  command: string;
  status: "running" | "success" | "error";
  progress: number;
  started: string;
  finished: string | null;
  resources: { id: number; type: string }[];
  error: { code: string; message: string } | null;
}

interface ActionResponse extends ApiResponse {
  action: Action;
}

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

export class HCloudError extends Error {
  override cause?: ApiError | FetchErrorCause;
  public constructor(message: string, cause?: ApiError | FetchErrorCause) {
    super(message, { cause });
    this.cause = cause;
  }
}

class ActionStillRunning extends Error {
  public readonly action: Action;
  public constructor(action: Action) {
    super(`[HCloud] action ${action.command} (${action.id}) still running`);
    this.action = action;
  }
}

export interface WaitForActionOptions {
  /** Polling interval in ms. Default: 2000. */
  intervalMs?: number;
  /** Total number of retries. Default: 90. */
  retries?: number;
}

export class HCloudClientBase {
  protected readonly api: KyInstance;

  public constructor(apiKey: string) {
    this.api = ky.create({
      baseUrl: "https://api.hetzner.cloud/v1/",
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      hooks: {
        beforeRequest: [
          ({ request }) => {
            logger.debug(
              { url: request.url, method: request.method },
              "[HCloud] request",
            );
          },
        ],
      },
    });
  }

  /**
   * Hetzner Cloud has no token-verification endpoint; auth is validated
   * lazily on the first authenticated request.
   */
  public verifyUserToken(): Promise<void> {
    return Promise.resolve();
  }

  public async getAction(id: number): Promise<Action> {
    const errorMessage = `[HCloud] failed to get an action with id ${id}`;
    try {
      const { action, error } = await this.api
        .get(`actions/${id}`)
        .json<ActionResponse>();

      if (error) {
        throw new HCloudError(errorMessage, error);
      }
      return action;
    } catch (error) {
      throw new HCloudError(errorMessage, getFetchErrorCause(error));
    }
  }

  /**
   * Poll the action endpoint until it transitions out of `running`. Throws
   * `HCloudError` on action failure or polling timeout. Returns the final
   * action so callers can inspect command/finished/resources if needed.
   */
  public async waitForAction(
    action: Action,
    opts: WaitForActionOptions = {},
  ): Promise<Action> {
    const { intervalMs = 2000, retries = 90 } = opts;

    let final: Action;
    try {
      final = await retry(
        async () => {
          const current = await this.getAction(action.id);
          if (current.status === "running") {
            logger.debug(
              { id: current.id, command: current.command, progress: current.progress },
              "[HCloud] waiting for action",
            );
            throw new ActionStillRunning(current);
          }
          return current;
        },
        {
          retries,
          delay: intervalMs,
          shouldRetry: (error) => error instanceof ActionStillRunning,
        },
      );
    } catch (error) {
      if (error instanceof ActionStillRunning) {
        throw new HCloudError(
          `[HCloud] action ${action.command} (${action.id}) timed out after ${60 * intervalMs}ms`,
        );
      }
      throw error;
    }

    if (final.status === "error") {
      const cause: ApiError | undefined = final.error
        ? { code: final.error.code, message: final.error.message }
        : undefined;
      throw new HCloudError(
        `[HCloud] action ${final.command} (${final.id}) failed${
          final.error ? `: ${final.error.message}` : ""
        }`,
        cause,
      );
    }
    return final;
  }
}
