

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
   * git variable missing
   */
  GIT_MISSING = "GIT_MISSING",

  /**
   * File is missing
   */
  FILE_MISSING = "FILE_MISSING",

  /**
   * Template error
   */
  TEMPLATE_ERROR = "TEMPLATE_ERROR",
  
  /**
   * Provider init error
   */
  PROVIDER_INIT_ERROR = "PROVIDER_INIT_ERROR",

  /**
   * Provider init error
   */
  STATE_OR_DEPLOYER_MISSING = "STATE_OR_DEPLOYER_MISSING",

  /**
   * Provider init error
   */
  STATE_OR_DEPLOYER = "STATE_OR_DEPLOYER",
}