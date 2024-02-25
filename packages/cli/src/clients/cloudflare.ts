import { stringify } from "querystring";

interface CloudflareErrorCause {
  code: string;
  message: string;
  error_chain: unknown[]
}

interface CloudflareListResponse<D> {
  result?: D;
  success: boolean;
  errors?: CloudflareErrorCause[];
  resultInfo?: {
    total_count: number
  }
}

interface CloudflareResponse<D> {
  result?: D;
  success: boolean;
  errors?: CloudflareErrorCause[];
}

interface VerifyTokenResult {
  "expires_on": string
  "id": string
  "not_before": string
  "status": "active" | "disabled" | "expired"
}

class CloudflareError extends Error {
  public constructor(message: string, cause?: CloudflareErrorCause[]) {
    super(message, { cause });
  }
}

export class CloudflareClient {
  private readonly apiKey: string;
  private readonly baseUrl = "https://api.cloudflare.com/client/v4";

  public constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeListRequest<T>(path: string, body?: BodyInit): Promise<T> {
    const query = stringify({
      per_page: 10000,
    });
    
    return fetch(`${this.baseUrl}/${path}?${query}`, {
      body,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    }).then(async d => {
      const { 
        result, 
        success, 
        errors,
      } = await d.json() as CloudflareListResponse<T>;
      
      if (success && result) {
        return result;
      }
      else {
        throw new CloudflareError("Cloudflare request error", errors);
      }
    });
  }

  private async makeRequest<T>(path: string, body?: BodyInit): Promise<T> {    
    return fetch(`${this.baseUrl}/${path}`, {
      body,
      headers: {
        "Authorization": `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
    }).then(async d => {
      const { 
        result, 
        success, 
        errors,
      } = await d.json() as CloudflareResponse<T>;
      
      if (success && result) {
        return result;
      }
      else {
        throw new CloudflareError("Cloudflare request error", errors);
      }
    });
  }

  /**
   * Verify that user supplied token is active
   */
  public async verifyUserToken(): Promise<void> {
    const {status} = await this.makeRequest<VerifyTokenResult>("/user/tokens/verify");
    if (status !== "active") {
      throw new CloudflareError(`Token is not active: ${status}`);
    }
  }
}