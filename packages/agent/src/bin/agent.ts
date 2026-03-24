import config from "../config.ts";
import { Command } from "commander";
import { logger } from "../logger.ts";
import { start } from "../start.ts";
import { install } from "../install.ts";
import { upgrade } from "../upgrade.ts";
import type { Level } from "pino";
import { VERSION } from "../version.ts";

const program = new Command();

program
  .name("agent")
  .description("Golde infrastructure agent CLI")
  .version(VERSION);

program
  .command("start")
  .description("Start agent")
  .option("-l, --logLevel <level>", "define log level", config.API_LOG_LEVEL)
  .option("-p, --pretty", "pretty print logs", config.API_LOG_PRETTY)
  .action(
    function ({ logLevel, pretty }: { logLevel: Level; pretty: boolean }) {
      logger.configure(logLevel, pretty);
      start();
    },
  );

program
  .command("install")
  .description("Install agent")
  .option("-l, --logLevel <level>", "define log level", config.API_LOG_LEVEL)
  .option("-p, --pretty", "pretty print logs", config.API_LOG_PRETTY)
  .action(
    function ({ logLevel, pretty }: { logLevel: Level; pretty: boolean }) {
      logger.configure(logLevel, pretty);
      install();
    },
  );

program
  .command("upgrade")
  .description("Check for new version and upgrade")
  .option("-l, --logLevel <level>", "define log level", config.API_LOG_LEVEL)
  .option("-p, --pretty", "pretty print logs", config.API_LOG_PRETTY)
  .action(
    function ({ logLevel, pretty }: { logLevel: Level; pretty: boolean }) {
      logger.configure(logLevel, pretty);
      upgrade();
    },
  );

program.parse();
