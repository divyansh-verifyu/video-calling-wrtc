import jwt, { type Algorithm, type SignOptions } from "jsonwebtoken";
import { type IssuedToken } from "../../domain/entities/token.js";
import {
  type TokenIssuer,
  type TokenPayload,
} from "../../domain/ports/token-issuer.port.js";

export interface JwtTokenIssuerOptions {
  readonly secret: string;
  readonly algorithm?: Algorithm;
}

export class JwtTokenIssuer implements TokenIssuer {
  private readonly secret: string;
  private readonly algorithm: Algorithm;

  constructor(options: JwtTokenIssuerOptions) {
    if (!options.secret) {
      throw new Error("JwtTokenIssuer requires a non-empty secret");
    }
    this.secret = options.secret;
    this.algorithm = options.algorithm ?? "HS256";
  }

  issue(payload: TokenPayload, ttlSeconds: number): Promise<IssuedToken> {
    return new Promise((resolve, reject) => {
      const signOpts: SignOptions = {
        algorithm: this.algorithm,
        expiresIn: ttlSeconds,
      };
      jwt.sign(
        { ...payload },
        this.secret,
        signOpts,
        (err, token) => {
          if (err || !token) {
            reject(err ?? new Error("JWT signing failed without error object"));
            return;
          }
          const expiresAt = new Date(Date.now() + ttlSeconds * 1000);
          resolve({ value: token, expiresAt });
        },
      );
    });
  }
}
