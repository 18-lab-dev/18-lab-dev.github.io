import { defineConfig } from "vitepress";
import { vosuGuide } from "./sidebar/vosu-guide";
import { vosuDevApi } from "./sidebar/vosu-dev-api";
import { vosuDevBuild } from "./sidebar/vosu-dev-build";
import { vosulay } from "./sidebar/vosulay";

const SITE = "https://shiruviaa.github.io";
const DESCRIPTION =
  "shiruviaa builds osu! tooling engineered for performance and power users: vosu, the native telemetry daemon, and vosulay, the in-game overlay manager.";

export default defineConfig({
  lang: "en-US",
  title: "shiruviaa",
  description: DESCRIPTION,
  cleanUrls: true,
  lastUpdated: true,
  appearance: "dark",
  sitemap: { hostname: SITE },

  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/kitsune.svg" }],
    ["link", { rel: "apple-touch-icon", href: "/avatar.png" }],
    ["meta", { name: "theme-color", content: "#0e0b1a" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:site_name", content: "shiruviaa" }],
    ["meta", { property: "og:image", content: `${SITE}/og-banner.png` }],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
  ],

  markdown: {
    theme: { light: "github-light", dark: "catppuccin-mocha" },
  },

  themeConfig: {
    logo: { src: "/kitsune.svg", alt: "" },
    siteTitle: "shiruviaa",

    nav: [
      {
        text: "vosu",
        activeMatch: "^/vosu/",
        items: [
          { text: "Overview", link: "/vosu/" },
          { text: "User guide", link: "/vosu/guide/" },
          { text: "Developer docs", link: "/vosu/dev/" },
          { text: "Build an overlay", link: "/vosu/dev/tutorial/" },
        ],
      },
      { text: "vosulay", link: "/vosulay/", activeMatch: "^/vosulay/" },
      {
        text: "Releases",
        items: [
          { text: "vosu", link: "https://github.com/shiruviaa/vosu/releases/latest" },
          { text: "vosulay", link: "https://github.com/shiruviaa/vosulay/releases/latest" },
        ],
      },
    ],

    sidebar: {
      "/vosu/guide/": vosuGuide,
      "/vosu/dev/": [...vosuDevApi, ...vosuDevBuild],
      "/vosulay/": vosulay,
    },

    socialLinks: [{ icon: "github", link: "https://github.com/shiruviaa" }],

    search: { provider: "local" },

    outline: { level: [2, 3] },

    editLink: {
      pattern: "https://github.com/shiruviaa/shiruviaa.github.io/edit/main/docs/:path",
      text: "Edit this page on GitHub",
    },

    footer: {
      message:
        'Site and documentation released under the <a href="https://github.com/shiruviaa/shiruviaa.github.io/blob/main/LICENSE">MIT License</a>. Not affiliated with ppy or the tosu project.',
      copyright: "© 2026 shiruviaa · nine tails, zero frame drops",
    },
  },
});
