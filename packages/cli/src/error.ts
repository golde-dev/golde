export enum ConfigErrorCode {
  /**
   * Thrown when config file is missing
   */
  NO_CONFIG = "NO_CONFIG",

  /**
   * Thrown when config file is missing
   */
  NO_CUSTOM_CONFIG = "NO_CUSTOM_CONFIG",

  /**
   * When config fail to validate zod schema
   */
  INVALID_CONFIG = "INVALID_CONFIG",

  /**
   * When managed config value is not found
   */
  MANAGED_CONFIG_NOT_FOUND = "MANAGED_CONFIG_NOT_FOUND",

  /**
   * Env variable missing
   */
  ENV_MISSING = "ENV_MISSING",

  /**
   * git variable missing
   */
  GIT_MISSING = "GIT_MISSING",

  /**
   * File is missing
   */
  FILE_MISSING = "FILE_MISSING",

  /**
   * Generic template error
   */
  TEMPLATE_ERROR = "TEMPLATE_ERROR",

  /**
   * Missing state dependencies
   */
  STATE_MISSING = "STATE_MISSING",
}

export class ConfigError extends Error {
  public code: ConfigErrorCode;

  public constructor(message: string, code: ConfigErrorCode, cause?: unknown) {
    super(message, { cause });
    this.code = code;
  }
}

export enum ContextErrorCode {
  /**
   * Provider init error
   */
  STATE_OR_GOLDE_MISSING = "STATE_OR_GOLDE_MISSING",
}

export class ContextError extends Error {
  public code: ContextErrorCode;

  public constructor(message: string, code: ContextErrorCode, cause?: unknown) {
    super(message, { cause });
    this.code = code;
  }
}

export enum PlanErrorCode {
  /**
   * Provider is missing
   */
  PROVIDER_MISSING = "PROVIDER_MISSING",

  /**
   * Resource is already exists
   * eg: create bucket when bucket already exists
   */
  RESOURCE_EXISTS = "RESOURCE_EXISTS",
  /**
   * Permission denied,
   *  eg: when user credentials are lack required permissions to perform action
   */
  PERMISSION_DENIED = "PERMISSION_DENIED",
  /**
   * Resource is already exists
   * eg: create bucket when bucket already exists in s3 global namespace
   */
  RESOURCE_CONFLICT = "RESOURCE_CONFLICT",

  /**
   * Resource is not found
   * eg: delete bucket when bucket does not exist
   */
  RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND",
}

export class PlanError extends Error {
  public code: PlanErrorCode;

  public constructor(message: string, code: PlanErrorCode, cause?: unknown) {
    super(message, { cause });
    this.code = code;
  }
}
