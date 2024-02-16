import { defineWorkspace } from "vitest/config";

const projects = [
  "cli", 
];

export default defineWorkspace(
  projects.map(name => {
    return {
      extends: `./packages/${name}/vitest.config.ts`,
      test: {
        root: `./packages/${name}/`,
        name,
        include: [
          "src/**/*.test.ts",
          "src/**/*.test.tsx",
        ],
      },
    };
  })
);

  