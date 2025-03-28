import { logger } from "../../logger.ts";

interface SlackErrorCause {
  url: string;
  status: number;
  statusText: string;
}

export class SlackError extends Error {
  public override cause?: SlackErrorCause;

  public constructor(message: string, cause?: SlackErrorCause) {
    super(message);
    this.cause = cause;
  }
}

export class SlackClient {
  private readonly baseUrl: string = "https://slack.com/api/";
  private readonly apiKey: string;

  public constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  protected makeRequest<T>(
    path: string,
    method = "GET",
    body?: object,
  ): Promise<T> {
    logger.debug("[Slack] request", {
      path,
      body,
      method,
    });
    return fetch(`${this.baseUrl}${path}`, {
      method,
      body: JSON.stringify(body),
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    }).then(async (r) => {
      if (!r.ok) {
        throw new SlackError("Slack request failed", {
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
      if (error instanceof SlackError) {
        throw error;
      }
      throw new SlackError("Slack request failed", error);
    });
  }

  public async verifyToken(): Promise<void> {
    logger.debug("[Slack] verifying token");
    try {
      await this.makeRequest<void>("auth.test", "GET");
    } catch (error) {
      if (error instanceof SlackError) {
        throw error;
      }
      throw new SlackError("Slack token verification failed");
    }
  }

  public async sendMessage(channel: string, message: string): Promise<void> {
    await this.makeRequest<void>("chat.postMessage", "POST", {
      channel,
      text: message,
    });
  }
}
