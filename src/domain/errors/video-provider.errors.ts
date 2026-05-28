import { DomainError } from "./domain.error.js";

export class MeetingCreationFailed extends DomainError {
  readonly code = "MEETING_CREATION_FAILED";
  readonly httpStatus = 502;
}

export class MeetingValidationFailed extends DomainError {
  readonly code = "MEETING_VALIDATION_FAILED";
  readonly httpStatus = 404;
}

export class UpstreamUnavailable extends DomainError {
  readonly code = "UPSTREAM_UNAVAILABLE";
  readonly httpStatus = 503;
}

export class UpstreamUnauthorized extends DomainError {
  readonly code = "UPSTREAM_UNAUTHORIZED";
  readonly httpStatus = 401;
}
