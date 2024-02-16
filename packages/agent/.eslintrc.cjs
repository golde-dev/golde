
module.exports = {
  extends: "@chyzwar/eslint-config/node",
  parserOptions: {
    tsconfigRootDir: __dirname,
  },
  rules: {
    "@typescript-eslint/explicit-function-return-type": ["error", {
      allowFunctionsWithoutTypeParameters: true,
    }],
    "@typescript-eslint/explicit-module-boundary-types": ["off"],
    "@typescript-eslint/indent": ["off"],
  },
};