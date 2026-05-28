import { z } from "zod";

const csv = (defaultValue: string) =>
  z
    .string()
    .default(defaultValue)
    .transform((v) =>
      v
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p.length > 0),
    )
    .pipe(z.array(z.string().min(1)).min(1));

const numericString = (min: number, max: number, defaultValue: number) =>
  z.coerce.number().int().min(min).max(max).default(defaultValue);

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(["development", "production", "test"])
      .default("development"),

    HOST: z.string().min(1).default("0.0.0.0"),
    PORT: numericString(1, 65535, 9000),

    VIDEOSDK_API_KEY: z.string().min(1, "VIDEOSDK_API_KEY is required"),
    VIDEOSDK_SECRET_KEY: z.string().min(1, "VIDEOSDK_SECRET_KEY is required"),
    VIDEOSDK_API_ENDPOINT: z
      .string()
      .url()
      .default("https://api.videosdk.live"),
    VIDEOSDK_DEFAULT_REGION: z.string().min(1).default("sg001"),

    TOKEN_TTL_SECONDS: numericString(60, 3600, 600),
    TOKEN_PERMISSIONS: csv("allow_join,allow_mod"),

    HTTP_TIMEOUT_MS: numericString(1000, 60000, 10000),
    HTTP_RETRY_ATTEMPTS: numericString(0, 5, 3),

    RATE_LIMIT_WINDOW_MS: numericString(1000, 3_600_000, 60_000),
    RATE_LIMIT_MAX: numericString(1, 100_000, 120),

    LOG_LEVEL: z
      .enum(["fatal", "error", "warn", "info", "debug", "trace"])
      .default("info"),

    CORS_ORIGINS: csv("*"),

    SHUTDOWN_TIMEOUT_MS: numericString(1000, 60_000, 10_000),

    BOOTSTRAP_MEETING_ON_START: z
      .enum(["true", "false"])
      .default("true")
      .transform((v) => v === "true"),
  })
  .superRefine((cfg, ctx) => {
    if (cfg.NODE_ENV === "production" && cfg.CORS_ORIGINS.includes("*")) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["CORS_ORIGINS"],
        message: 'CORS_ORIGINS="*" is not allowed in production',
      });
    }
  });

export type Config = Readonly<z.infer<typeof envSchema>>;
