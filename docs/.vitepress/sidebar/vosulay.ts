import type { DefaultTheme } from "vitepress";

export const vosulay: DefaultTheme.SidebarItem[] = [
  {
    text: "vosulay",
    items: [
      { text: "Overview", link: "/vosulay/" },
      { text: "Install", link: "/vosulay/install" },
      { text: "Your first overlay", link: "/vosulay/getting-started" },
    ],
  },
  {
    text: "Layouts and content",
    items: [
      { text: "Overlay editor", link: "/vosulay/editor" },
      { text: "Profiles", link: "/vosulay/profiles" },
      { text: "Add and configure overlays", link: "/vosulay/overlays" },
      { text: "Remote profile pages", link: "/vosulay/remote" },
    ],
  },
  {
    text: "Platform and maintenance",
    items: [
      { text: "Linux", link: "/vosulay/linux" },
      { text: "Windows", link: "/vosulay/windows" },
      { text: "Settings and configuration", link: "/vosulay/settings" },
      { text: "Troubleshooting", link: "/vosulay/troubleshooting" },
      { text: "Uninstall", link: "/vosulay/uninstall" },
    ],
  },
];
