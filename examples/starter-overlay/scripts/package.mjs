import { copyFileSync } from "node:fs";

for (const name of ["metadata.txt", "settings.schema.toml", "settings.json"]) {
  copyFileSync(new URL(`../${name}`, import.meta.url), new URL(`../dist/${name}`, import.meta.url));
}
