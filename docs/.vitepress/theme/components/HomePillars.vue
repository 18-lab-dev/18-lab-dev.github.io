<script setup lang="ts">
const pillars = [
  {
    n: "1",
    title: "native & measured",
    body: "Native Rust, no Node.js or Electron underneath. Hot paths have Criterion benchmarks, and the results and their limits are published next to the code.",
    color: "var(--sh-pink)",
  },
  {
    n: "2",
    title: "linux first-class",
    body: "Native osu!lazer telemetry on Linux, process events over eBPF or CN_PROC, and in-game overlays for Vulkan, OpenGL, Wayland, X11, and Wine. Windows is supported too.",
    color: "var(--sh-violet)",
  },
  {
    n: "3",
    title: "built for power users",
    body: "tosu-compatible APIs, so existing overlays keep working, plus extensions for people who want more: selected-field streams, per-key timing, and release hit errors.",
    color: "var(--sh-gold)",
  },
];
</script>

<template>
  <section class="sh-pillars" aria-labelledby="sh-pillars-title">
    <h2 id="sh-pillars-title" class="sh-eyebrow">how we build</h2>
    <ol class="grid">
      <li v-for="p in pillars" :key="p.n" :style="{ '--c': p.color }">
        <span class="circle" aria-hidden="true">{{ p.n }}</span>
        <h3>{{ p.title }}</h3>
        <p>{{ p.body }}</p>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.sh-pillars {
  margin: 72px auto 0;
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
  margin: 0;
  padding: 0;
  list-style: none;
  grid-template-columns: 1fr;
}

@media (min-width: 860px) {
  .grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

li {
  padding: 26px 24px 24px;
  border-radius: 18px;
  border: 1px solid var(--vp-c-divider);
  background: color-mix(in srgb, var(--vp-c-bg-soft) 60%, transparent);
}

.circle {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid color-mix(in srgb, var(--c) 65%, transparent);
  box-shadow: 0 0 0 6px color-mix(in srgb, var(--c) 12%, transparent);
  font-family: var(--vp-font-family-mono);
  font-weight: 600;
  color: var(--c);
}

h3 {
  margin: 18px 0 8px;
  font-family: var(--vp-font-family-mono);
  font-size: 17px;
  font-weight: 600;
  color: var(--vp-c-text-1);
}

p {
  margin: 0;
  font-size: 15px;
  line-height: 1.65;
  color: var(--vp-c-text-2);
}
</style>
