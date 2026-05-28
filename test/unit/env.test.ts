import { describe, expect, it } from "vitest";
import {
  EnvValidationError,
  loadConfig,
} from "../../src/infrastructure/config/env.js";

const baseEnv = {
  VIDEOSDK_API_KEY: "key",
  VIDEOSDK_SECRET_KEY: "secret",
} as const;

describe("loadConfig", () => {
  it("loads defaults when only required vars are present", () => {
    const config = loadConfig({ ...baseEnv } as NodeJS.ProcessEnv);
    expect(config.PORT).toBe(9000);
    expect(config.NODE_ENV).toBe("development");
    expect(config.TOKEN_TTL_SECONDS).toBe(600);
    expect(config.TOKEN_PERMISSIONS).toEqual(["allow_join", "allow_mod"]);
  });

  it("throws EnvValidationError when required vars are missing", () => {
    expect(() => loadConfig({} as NodeJS.ProcessEnv)).toThrow(EnvValidationError);
  });

  it("forbids CORS_ORIGINS=* in production", () => {
    expect(() =>
      loadConfig({
        ...baseEnv,
        NODE_ENV: "production",
        CORS_ORIGINS: "*",
      } as NodeJS.ProcessEnv),
    ).toThrow(EnvValidationError);
  });

  it("coerces PORT and rejects out-of-range values", () => {
    const config = loadConfig({
      ...baseEnv,
      PORT: "3000",
    } as NodeJS.ProcessEnv);
    expect(config.PORT).toBe(3000);

    expect(() =>
      loadConfig({ ...baseEnv, PORT: "0" } as NodeJS.ProcessEnv),
    ).toThrow(EnvValidationError);
  });

  it("parses CSV TOKEN_PERMISSIONS and CORS_ORIGINS", () => {
    const config = loadConfig({
      ...baseEnv,
      TOKEN_PERMISSIONS: "allow_join, allow_mod, ask_join",
      CORS_ORIGINS: "https://a.com, https://b.com",
    } as NodeJS.ProcessEnv);
    expect(config.TOKEN_PERMISSIONS).toEqual([
      "allow_join",
      "allow_mod",
      "ask_join",
    ]);
    expect(config.CORS_ORIGINS).toEqual([
      "https://a.com",
      "https://b.com",
    ]);
  });

  it("returns a frozen config object", () => {
    const config = loadConfig({ ...baseEnv } as NodeJS.ProcessEnv);
    expect(Object.isFrozen(config)).toBe(true);
  });
});
