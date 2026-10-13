<script setup lang="ts">
import { withBase } from "vitepress";

interface Project {
  slug: string;
  icon: string;
  kicker: string;
  blurb: string;
  pills: string[];
  docs: { text: string; link: string }[];
  repo: string;
  accent: string;
}

const projects: Project[] = [
  {
    slug: "vosu",
    icon: "/vosu-icon.svg",
    kicker: "osu! telemetry daemon",
    blurb:
      "Live osu!stable and osu!lazer state, counters, and tosu-compatible HTTP and WebSocket APIs from one native Rust daemon. No Node.js, no Electron, no separate .NET runtime.",
    pills: ["rust", "stable + lazer", "linux", "windows"],
    docs: [
      { text: "User guide", link: "/vosu/guide/" },
      { text: "API reference", link: "/vosu/dev/" },
    ],
    repo: "https://github.com/shiruviaa/vosu",
    accent: "var(--sh-pink)",
  },
  {
    slug: "vosulay",
    icon: "/vosulay-icon.svg",
    kicker: "in-game overlay manager",
    blurb:
      "Your tosu-compatible counters, rendered inside osu! itself. Position, scale, and profile overlays in game on Linux and Windows, with one CEF browser runtime.",
    pills: ["rust", "cef", "vulkan + opengl", "linux", "windows"],
    docs: [
      { text: "Get started", link: "/vosulay/getting-started" },
      { text: "Docs", link: "/vosulay/" },
    ],
    repo: "https://github.com/shiruviaa/vosulay",
    accent: "var(--sh-violet)",
  },
];
</script>

<template>
  <section class="sh-projects" aria-labelledby="sh-projects-title">
    <h2 id="sh-projects-title" class="sh-eyebrow">our work</h2>
    <div class="grid">
      <article v-for="p in projects" :key="p.slug" class="card" :style="{ '--accent': p.accent }">
        <header>
          <img :src="withBase(p.icon)" alt="" width="64" height="64" />
          <div>
            <h3>{{ p.slug }}</h3>
            <p class="kicker">{{ p.kicker }}</p>
          </div>
          <a class="repo" :href="p.repo" :aria-label="`${p.slug} on GitHub`">
            <span aria-hidden="true">↗</span>
          </a>
        </header>
        <p class="blurb">{{ p.blurb }}</p>
        <ul class="pills" aria-label="Highlights">
          <li v-for="pill in p.pills" :key="pill">{{ pill }}</li>
        </ul>
        <nav class="links">
          <a v-for="d in p.docs" :key="d.link" :href="withBase(d.link)">{{ d.text }} →</a>
        </nav>
      </article>
    </div>
  </section>
</template>

<style scoped>
.sh-projects {
  margin: 24px auto 0;
}

.sh-eyebrow {
  border-top: 0;
  padding-top: 0;
  line-height: 1.4;
  margin: 0 0 20px;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
}

.grid {
  display: grid;
  gap: 20px;
  grid-template-columns: 1fr;
}

@media (min-width: 860px) {
  .grid {
    grid-template-columns: 1fr 1fr;
  }
}

.card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 28px;
  border-radius: 20px;
  border: 1px solid var(--vp-c-divider);
  background:
    radial-gradient(
      28rem 14rem at 100% 0%,
      color-mix(in srgb, var(--accent) 16%, transparent),
      transparent 70%
    ),
    color-mix(in srgb, var(--vp-c-bg-soft) 80%, transparent);
  backdrop-filter: blur(8px);
  transition:
    transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 0.3s,
    box-shadow 0.3s;
}

.card:hover {
  transform: translateY(-3px);
  border-color: color-mix(in srgb, var(--accent) 55%, transparent);
  box-shadow: 0 18px 50px -24px color-mix(in srgb, var(--accent) 70%, transparent);
}

header {
  display: flex;
  align-items: center;
  gap: 16px;
}

header img {
  border-radius: 16px;
  flex: none;
}

h3 {
  margin: 0;
  font-size: 28px;
  font-weight: 650;
  letter-spacing: -0.03em;
  line-height: 1.1;
  color: var(--vp-c-text-1);
}

.kicker {
  margin: 4px 0 0;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  letter-spacing: 0.06em;
  color: var(--accent);
}

.repo {
  margin-left: auto;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 1px solid var(--vp-c-border);
  color: var(--vp-c-text-2);
  font-size: 18px;
  text-decoration: none;
  transition:
    color 0.2s,
    border-color 0.2s;
}

.repo:hover {
  color: var(--accent);
  border-color: var(--accent);
}

.blurb {
  margin: 0;
  font-size: 16px;
  line-height: 1.65;
  color: var(--vp-c-text-2);
}

.pills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.pills li {
  padding: 3px 12px;
  border-radius: 999px;
  border: 1px solid rgba(139, 108, 255, 0.4);
  background: rgba(139, 108, 255, 0.1);
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
  color: var(--vp-c-text-2);
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-top: auto;
  padding-top: 4px;
}

.links a {
  font-weight: 600;
  font-size: 15px;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.links a:hover {
  color: var(--vp-c-brand-2);
}

@media (prefers-reduced-motion: reduce) {
  .card,
  .card:hover {
    transition: none;
    transform: none;
  }
}
</style>
