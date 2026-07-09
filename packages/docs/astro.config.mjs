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
          items: [{ autogenerate: { directory: "start-here" } }],
        },
        {
          label: "Concepts",
          items: [{ autogenerate: { directory: "concepts" } }],
        },
        {
          label: "Guides",
          items: [{ autogenerate: { directory: "guides" } }],
        },
        {
          label: "Providers",
          items: [{ autogenerate: { directory: "providers" } }],
        },
        {
          label: "CLI Reference",
          items: [{ autogenerate: { directory: "cli" } }],
        },
        {
          label: "Configuration Reference",
          items: [{ autogenerate: { directory: "config" } }],
        },
        {
          label: "Self-Hosted Agent",
          items: [{ autogenerate: { directory: "agent" } }],
        },
      ],
    }),
  ],
});
