import { UpstreamUnavailable } from "../../domain/errors/video-provider.errors.js";
import {
  type HttpClient,
  type HttpRequest,
  type HttpResponse,
} from "../../domain/ports/http-client.port.js";
import { type Logger } from "../../domain/ports/logger.port.js";

export interface FetchHttpClientOptions {
  readonly defaultTimeoutMs: number;
  readonly defaultRetryAttempts: number;
}

const RETRYABLE_STATUSES = new Set([408, 429, 500, 502, 503, 504]);
const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const backoffMs = (attempt: number): number => {
  const base = 200 * Math.pow(2, attempt);
  const jitter = Math.floor(Math.random() * 200);
  return Math.min(base + jitter, 5000);
};

export class FetchHttpClient implements HttpClient {
  constructor(
    private readonly options: FetchHttpClientOptions,
    private readonly logger: Logger,
  ) {}

  async request<T = unknown>(req: HttpRequest): Promise<HttpResponse<T>> {
    const timeoutMs = req.timeoutMs ?? this.options.defaultTimeoutMs;
    const maxAttempts = (req.retryAttempts ?? this.options.defaultRetryAttempts) + 1;

    let lastError: unknown;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => {
        controller.abort();
      }, timeoutMs);

      try {
        const headers: Record<string, string> = {
          accept: "application/json",
          ...(req.headers ?? {}),
        };
        const hasBody = req.body !== undefined && req.body !== null;
        if (hasBody && !("content-type" in headers)) {
          headers["content-type"] = "application/json";
        }

        const init: RequestInit = {
          method: req.method,
          headers,
          signal: controller.signal,
        };
        if (hasBody) {
          init.body = JSON.stringify(req.body);
        }
        const response = await fetch(req.url, init);

        const responseHeaders: Record<string, string> = {};
        response.headers.forEach((value, key) => {
          responseHeaders[key] = value;
        });

        const contentType = response.headers.get("content-type") ?? "";
        const body: unknown = contentType.includes("application/json")
          ? await response.json()
          : await response.text();

        if (
          RETRYABLE_STATUSES.has(response.status) &&
          attempt < maxAttempts - 1
        ) {
          this.logger.warn(
            {
              attempt: attempt + 1,
              maxAttempts,
              status: response.status,
              url: req.url,
            },
            "upstream returned retryable status, retrying",
          );
          await sleep(backoffMs(attempt));
          continue;
        }

        return {
          status: response.status,
          headers: responseHeaders,
          body: body as T,
        };
      } catch (err) {
        lastError = err;
        const isAbort = err instanceof Error && err.name === "AbortError";
        this.logger.warn(
          {
            attempt: attempt + 1,
            maxAttempts,
            url: req.url,
            err: err instanceof Error ? err.message : String(err),
            isAbort,
          },
          "upstream fetch failed",
        );
        if (attempt < maxAttempts - 1) {
          await sleep(backoffMs(attempt));
          continue;
        }
      } finally {
        clearTimeout(timer);
      }
    }

    throw new UpstreamUnavailable(
      `Upstream request to ${req.url} failed after ${String(maxAttempts)} attempts`,
      lastError,
    );
  }
}
