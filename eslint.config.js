import eslint from "@eslint/js";
import tsEslint from "typescript-eslint";
import globals from "globals";

export default tsEslint.config(
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  {
    ignores: [
      "**/dist",
      "**/.astro",
      "**/.next",
      "**/.yarn",
      "packages/agent", 
      "packages/cli",
    ],
  },
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  }
);