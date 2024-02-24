

export enum ErrorCode {
  /**
   * Thrown when config file is missing
   */
  NO_CONFIG = "NO_CONFIG",

  /**
   * When config fail to validate
   */
  INVALID_CONFIG = "INVALID_CONFIG",

  /**
   * Env variable missing
   */
  ENV_MISSING = "ENV_MISSING",

  /**
   * File is missing
   */
  FILE_MISSING = "FILE_MISSING",
  
  /**
   * Template error
   */
  TEMPLATE_ERROR = "TEMPLATE_ERROR",
}