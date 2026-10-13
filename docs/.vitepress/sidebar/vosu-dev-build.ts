import type { DefaultTheme } from "vitepress";

export const vosuDevBuild: DefaultTheme.SidebarItem[] = [
  {
    text: "Build an overlay",
    items: [
      { text: "Overview", link: "/vosu/dev/tutorial/" },
      { text: "0. Prerequisites", link: "/vosu/dev/tutorial/00-prerequisites" },
      { text: "1. Project setup", link: "/vosu/dev/tutorial/01-project" },
      { text: "2. Connect", link: "/vosu/dev/tutorial/02-connect" },
      { text: "3. Render a HUD", link: "/vosu/dev/tutorial/03-render" },
      { text: "4. vosu extensions", link: "/vosu/dev/tutorial/04-extensions" },
      { text: "5. Settings", link: "/vosu/dev/tutorial/05-settings" },
      { text: "6. Package and test", link: "/vosu/dev/tutorial/06-package" },
    ],
  },
  {
    text: "Craft",
    items: [
      { text: "Overlay performance", link: "/vosu/dev/performance" },
      { text: "Developer tooling", link: "/vosu/dev/tooling" },
    ],
  },
];
