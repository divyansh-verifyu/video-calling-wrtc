import { type IssuedToken } from "../../domain/entities/token.js";
import { type Logger } from "../../domain/ports/logger.port.js";
import { type TokenIssuer } from "../../domain/ports/token-issuer.port.js";

export interface IssueTokenUseCaseOptions {
  readonly apiKey: string;
  readonly permissions: readonly string[];
  readonly ttlSeconds: number;
}

export class IssueTokenUseCase {
  constructor(
    private readonly issuer: TokenIssuer,
    private readonly options: IssueTokenUseCaseOptions,
    private readonly logger: Logger,
  ) {}

  async execute(): Promise<IssuedToken> {
    this.logger.debug(
      {
        ttlSeconds: this.options.ttlSeconds,
        permissions: this.options.permissions,
      },
      "issuing token",
    );
    return this.issuer.issue(
      {
        apikey: this.options.apiKey,
        permissions: [...this.options.permissions],
      },
      this.options.ttlSeconds,
    );
  }
}
