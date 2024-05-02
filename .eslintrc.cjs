
module.exports = {
  extends: "@chyzwar/eslint-config/node",
  parserOptions: {
    sourceType: "module",
    ecmaFeatures: {
      jsx: true,
    },
    useJSXTextNode: true,
    project: [
      "./packages/*/tsconfig.json",
    ],
    tsconfigRootDir: __dirname,
  },
};