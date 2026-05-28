import { type Config, envSchema } from "./env.schema.js";

export class EnvValidationError extends Error {
  constructor(readonly issues: readonly { path: string; message: string }[]) {
    super(
      `Invalid environment configuration:\n` +
        issues.map((i) => `  - ${i.path || "(root)"}: ${i.message}`).join("\n"),
    );
    this.name = "EnvValidationError";
  }
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const issues = result.error.issues.map((i) => ({
      path: i.path.join("."),
      message: i.message,
    }));
    throw new EnvValidationError(issues);
  }
  return Object.freeze(result.data);
}
