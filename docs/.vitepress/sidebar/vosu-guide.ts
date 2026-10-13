import type { DefaultTheme } from "vitepress";

export const vosuGuide: DefaultTheme.SidebarItem[] = [
  {
    text: "Start using vosu",
    items: [
      { text: "User guide", link: "/vosu/guide/" },
      { text: "Install", link: "/vosu/guide/install" },
      { text: "Dashboard", link: "/vosu/guide/dashboard" },
      { text: "Overlays", link: "/vosu/guide/overlays" },
    ],
  },
  {
    text: "Manage your installation",
    items: [
      { text: "Configuration", link: "/vosu/guide/configuration" },
      { text: "Linux setup", link: "/vosu/guide/linux" },
      { text: "Updates", link: "/vosu/guide/updates" },
      { text: "Troubleshooting", link: "/vosu/guide/troubleshooting" },
      { text: "Privacy and security", link: "/vosu/guide/privacy-security" },
      { text: "Uninstall", link: "/vosu/guide/uninstall" },
    ],
  },
];
