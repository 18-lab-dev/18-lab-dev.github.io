import type { DefaultTheme } from "vitepress";

export const vosuDevApi: DefaultTheme.SidebarItem[] = [
  {
    text: "API reference",
    items: [
      { text: "Developer overview", link: "/vosu/dev/" },
      { text: "HTTP API", link: "/vosu/dev/http-api" },
      { text: "WebSocket API", link: "/vosu/dev/websocket-api" },
      { text: "State schema", link: "/vosu/dev/schema" },
      { text: "vosu extensions", link: "/vosu/dev/vosu-extensions" },
      { text: "Overlay security", link: "/vosu/dev/security" },
      { text: "Counter packages", link: "/vosu/dev/counter-packages" },
    ],
  },
];
