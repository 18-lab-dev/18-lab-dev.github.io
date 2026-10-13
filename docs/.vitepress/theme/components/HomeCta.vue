<script setup lang="ts">
import { withBase } from "vitepress";

const links = [
  { text: "Build an overlay from scratch", link: "/vosu/dev/tutorial/", primary: true },
  { text: "API reference", link: "/vosu/dev/" },
  { text: "Performance guide", link: "/vosu/dev/performance" },
  { text: "Tooling with Vite + Oxc", link: "/vosu/dev/tooling" },
];
</script>

<template>
  <section class="sh-cta" aria-labelledby="sh-cta-title">
    <div class="copy">
      <h2 class="sh-eyebrow">for overlay developers</h2>
      <p id="sh-cta-title" class="headline">Ask for three fields. Get three fields.</p>
      <p class="body">
        vosu speaks tosu's APIs, so overlays you write today run on both. When vosu is the backend,
        the selected-field stream sends only the JSON Pointers you subscribe to, and only when they
        change. The guide starts there and falls back to tosu cleanly.
      </p>
      <nav class="links">
        <a
          v-for="l in links"
          :key="l.link"
          :class="{ primary: l.primary }"
          :href="withBase(l.link)"
          >{{ l.text }}</a
        >
      </nav>
    </div>
    <div class="code vp-doc">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.sh-cta {
  display: grid;
  gap: 32px;
  align-items: center;
  margin: 72px auto 0;
  grid-template-columns: 1fr;
}

@media (min-width: 960px) {
  .sh-cta {
    grid-template-columns: 4fr 6fr;
    gap: 48px;
  }
}

.sh-eyebrow {
  border-top: 0;
  padding-top: 0;
  line-height: 1.4;
  margin: 0 0 12px;
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--vp-c-brand-1);
}

.headline {
  margin: 0 0 14px;
  font-size: 30px;
  font-weight: 650;
  line-height: 1.2;
  letter-spacing: -0.03em;
  color: var(--vp-c-text-1);
}

.body {
  margin: 0 0 22px;
  font-size: 16px;
  line-height: 1.7;
  color: var(--vp-c-text-2);
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.links a {
  padding: 8px 16px;
  border-radius: 999px;
  border: 1px solid var(--vp-button-alt-border);
  background: var(--vp-button-alt-bg);
  color: var(--vp-c-text-1);
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition:
    background 0.2s,
    border-color 0.2s;
}

.links a:hover {
  background: var(--vp-button-alt-hover-bg);
  border-color: var(--vp-button-alt-hover-border);
}

.links a.primary {
  border-color: transparent;
  background: var(--vp-button-brand-bg);
  color: var(--vp-button-brand-text);
}

.links a.primary:hover {
  background: var(--vp-button-brand-hover-bg);
}

.code {
  min-width: 0;
}

.code :deep(div[class*="language-"]) {
  margin: 0;
  border-radius: 16px;
  border: 1px solid var(--vp-c-divider);
  box-shadow: 0 24px 60px -30px rgba(139, 108, 255, 0.55);
}
</style>
