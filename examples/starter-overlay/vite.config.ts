import { readFileSync } from "node:fs";
import { defineConfig } from "vite";

const { name: counterName } = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8"),
) as { name: string };

export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "counter-path",
      apply: "serve",
      transformIndexHtml() {
        return [
          {
            tag: "script",
            children: `window.COUNTER_PATH=${JSON.stringify(counterName)};`,
            injectTo: "head-prepend",
          },
        ];
      },
    },
  ],
  build: {
    target: "es2026",
    // Lightning CSS does not accept es2026 yet; its target is independent of JavaScript.
    cssTarget: "es2025",
    outDir: `dist/${counterName}`,
  },
});
