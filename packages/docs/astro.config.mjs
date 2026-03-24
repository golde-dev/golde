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
        { icon: "github", label: "GitHub", href: "https://github.com/withastro/starlight" },
      ],
      sidebar: [
        {
          label: "Guides",
          items: [
            // Each item here is one entry in the navigation menu.
            { label: "Example Guide", link: "/guides/example/" },
          ],
        },
        {
          label: "Reference",
          autogenerate: { directory: "reference" },
        },
      ],
    }),
  ],
});
