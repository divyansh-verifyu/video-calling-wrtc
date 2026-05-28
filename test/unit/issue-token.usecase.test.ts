import { describe, expect, it } from "vitest";
import { IssueTokenUseCase } from "../../src/application/use-cases/issue-token.usecase.js";
import { type IssuedToken } from "../../src/domain/entities/token.js";
import {
  type TokenIssuer,
  type TokenPayload,
} from "../../src/domain/ports/token-issuer.port.js";
import { NullLogger } from "../support/null-logger.js";

class FakeIssuer implements TokenIssuer {
  public lastPayload: TokenPayload | null = null;
  public lastTtl = 0;
  async issue(payload: TokenPayload, ttlSeconds: number): Promise<IssuedToken> {
    this.lastPayload = payload;
    this.lastTtl = ttlSeconds;
    return {
      value: "fake.jwt.token",
      expiresAt: new Date(Date.now() + ttlSeconds * 1000),
    };
  }
}

describe("IssueTokenUseCase", () => {
  it("forwards apiKey, permissions, and ttl to the issuer", async () => {
    const fake = new FakeIssuer();
    const useCase = new IssueTokenUseCase(
      fake,
      {
        apiKey: "my-key",
        permissions: ["allow_join", "allow_mod"],
        ttlSeconds: 600,
      },
      new NullLogger(),
    );

    const issued = await useCase.execute();

    expect(fake.lastPayload).toEqual({
      apikey: "my-key",
      permissions: ["allow_join", "allow_mod"],
    });
    expect(fake.lastTtl).toBe(600);
    expect(issued.value).toBe("fake.jwt.token");
    expect(issued.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });
});
