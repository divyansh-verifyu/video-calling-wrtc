import { type IssuedToken } from "../entities/token.js";

export type TokenPayload = Readonly<Record<string, unknown>>;

export interface TokenIssuer {
  issue(payload: TokenPayload, ttlSeconds: number): Promise<IssuedToken>;
}
