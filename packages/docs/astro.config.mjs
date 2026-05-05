import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

/**
 * @see https://astro.build/config
 */
export default defineConfig({
  site: "https://golde.dev/docs",
  integrations: [
    starlight({
      title: "Golde Docs",
      disable404Route: true,
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/golde-dev/golde" },
      ],
      sidebar: [
        {
          label: "Start Here",
          autogenerate: { directory: "start-here" },
        },
        {
          label: "Concepts",
          autogenerate: { directory: "concepts" },
        },
        {
          label: "Guides",
          autogenerate: { directory: "guides" },
        },
        {
          label: "Providers",
          autogenerate: { directory: "providers" },
        },
        {
          label: "CLI Reference",
          autogenerate: { directory: "cli" },
        },
        {
          label: "Configuration Reference",
          autogenerate: { directory: "config" },
        },
        {
          label: "Self-Hosted Agent",
          autogenerate: { directory: "agent" },
        },
      ],
    }),
  ],
});
