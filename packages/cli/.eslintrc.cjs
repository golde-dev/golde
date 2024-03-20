
module.exports = {
  extends: "@chyzwar/eslint-config/node",
  parserOptions: {
    tsconfigRootDir: __dirname,
  },
  rules: {
    "@typescript-eslint/naming-convention": ["off"],
    "@typescript-eslint/no-require-imports": ["off"],
    "@typescript-eslint/no-var-requires": ["off"],
    "@typescript-eslint/consistent-indexed-object-style": ["off"],
    "@typescript-eslint/no-unused-vars": [
      "error",
      {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_",
        "destructuredArrayIgnorePattern": "^_",
      },
    ],
  },
};