<script setup lang="ts">
import { computed } from "vue";

interface Value {
  v: number;
  s: string;
  range?: string;
}

interface Row {
  label: string;
  values: Record<string, Value | null>;
}

export interface Chart {
  id: string;
  title: string;
  series: string[];
  rows: Row[];
  note?: string;
}

const props = defineProps<{ chart: Chart; code?: boolean }>();

const LABELS: Record<string, string> = {
  tosu: "tosu 4.26.2",
  vosu: "vosu",
  vosuAlone: "vosu alone",
  before: "before",
  v102: "1.0.2 code",
  r1: "after round 1",
  after: "1.1.0 so far",
};

// The chip compares the reference series with vosu's: tosu vs vosu, or vosu before vs after.
const RATIO_PAIRS: [string, string, string][] = [
  ["tosu", "vosu", "tosu / vosu"],
  ["before", "after", "before / after"],
  ["v102", "after", "speedup since 1.0.2"],
];

const pair = computed(() =>
  RATIO_PAIRS.find(([a, b]) => props.chart.series.includes(a) && props.chart.series.includes(b)),
);

const max = computed(() =>
  Math.max(
    ...props.chart.rows.flatMap((row) => props.chart.series.map((key) => row.values[key]?.v ?? 0)),
  ),
);

function width(value: Value | null | undefined): string {
  if (!value || max.value === 0) return "0%";
  // Keep tiny but nonzero values visible next to much larger ones.
  return `${Math.max(1.2, (value.v / max.value) * 100).toFixed(2)}%`;
}

function ratio(row: Row): { text: string; better: boolean } | null {
  if (!pair.value) return null;
  const reference = row.values[pair.value[0]];
  const candidate = row.values[pair.value[1]];
  if (!reference || !candidate || candidate.v === 0) return null;
  const r = reference.v / candidate.v;
  return { text: `${r.toFixed(2)}×`, better: r >= 1 };
}
</script>

<template>
  <figure class="bench" :aria-label="`${chart.title}, lower is better`">
    <figcaption>
      <component :is="code ? 'code' : 'span'" class="title">{{ chart.title }}</component>
      <span class="legend" aria-hidden="true">
        <span v-for="key in chart.series" :key="key" class="key">
          <i :class="`swatch ${key}`" />{{ LABELS[key] ?? key }}
        </span>
      </span>
    </figcaption>
    <div v-for="row in chart.rows" :key="row.label" class="row">
      <div class="label">
        <span>{{ row.label }}</span>
        <span
          v-if="ratio(row)"
          class="ratio"
          :class="{ worse: !ratio(row)!.better }"
          :title="`${pair![0]} ÷ ${pair![1]}; above 1× means ${pair![1]} is lower`"
          >{{ pair![2] }} {{ ratio(row)!.text }}</span
        >
      </div>
      <div v-for="key in chart.series" :key="key" class="line">
        <span class="track">
          <span :class="`bar ${key}`" :style="{ width: width(row.values[key]) }" />
        </span>
        <span class="value" :class="{ missing: !row.values[key] }">
          <span class="who">{{ LABELS[key] ?? key }}</span>
          {{ row.values[key]?.s ?? "not measured" }}
          <small v-if="row.values[key]?.range">({{ row.values[key]!.range }})</small>
        </span>
      </div>
    </div>
    <p v-if="chart.note" class="note">{{ chart.note }}</p>
  </figure>
</template>

<style scoped>
.bench {
  margin: 20px 0;
  padding: 18px 20px 14px;
  border-radius: 14px;
  border: 1px solid var(--vp-c-divider);
  background: color-mix(in srgb, var(--vp-c-bg-soft) 70%, transparent);
}

figcaption {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: 6px 16px;
  margin-bottom: 10px;
}

.title {
  font-weight: 600;
  font-size: 15px;
  color: var(--vp-c-text-1);
}

code.title {
  font-size: 13.5px;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 14px;
  font-size: 12.5px;
  color: var(--vp-c-text-2);
}

.key {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.swatch {
  display: inline-block;
  width: 10px;
  height: 10px;
  border-radius: 3px;
}

.row {
  padding: 8px 0;
  border-top: 1px solid var(--vp-c-divider);
}

.row:first-of-type {
  border-top: 0;
}

.label {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 4px 12px;
  margin-bottom: 6px;
  font-size: 13.5px;
  font-weight: 500;
  color: var(--vp-c-text-1);
}

.ratio {
  padding: 1px 9px;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--sh-pink) 45%, transparent);
  background: color-mix(in srgb, var(--sh-pink) 12%, transparent);
  font-family: var(--vp-font-family-mono);
  font-size: 11.5px;
  font-weight: 500;
  color: var(--vp-c-brand-1);
}

.ratio.worse {
  border-color: color-mix(in srgb, var(--vp-c-text-3) 60%, transparent);
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
}

.line {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 12.5rem;
  align-items: center;
  gap: 12px;
  margin: 3px 0;
}

@media (max-width: 640px) {
  .line {
    grid-template-columns: minmax(0, 1fr) 6.5rem;
  }

  .value small {
    display: none;
  }
}

.track {
  height: 12px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--vp-c-text-3) 12%, transparent);
  overflow: hidden;
}

.bar {
  display: block;
  height: 100%;
  border-radius: 999px;
}

.swatch.tosu,
.bar.tosu {
  background: linear-gradient(90deg, #4f63d9, #7b8cff);
}

.swatch.vosu,
.bar.vosu {
  background: linear-gradient(90deg, #e2559c, #ff8cc4);
}

.swatch.before,
.bar.before,
.swatch.v102,
.bar.v102 {
  background: linear-gradient(90deg, #6b6385, #9a91b8);
}

.swatch.r1,
.bar.r1 {
  background: linear-gradient(90deg, #8b6cff, #b3a0ff);
}

.swatch.after,
.bar.after {
  background: linear-gradient(90deg, #e2559c, #ffd58a);
}

.swatch.vosuAlone,
.bar.vosuAlone {
  background: repeating-linear-gradient(
    -45deg,
    #b3a0ff 0 6px,
    color-mix(in srgb, #b3a0ff 55%, transparent) 6px 12px
  );
}

.value {
  font-family: var(--vp-font-family-mono);
  font-size: 12.5px;
  color: var(--vp-c-text-1);
  white-space: nowrap;
}

.value small {
  color: var(--vp-c-text-3);
  font-size: 11px;
}

.value.missing {
  color: var(--vp-c-text-3);
}

/* The legend names the series; repeat it per bar only for screen readers. */
.who {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}

.note {
  margin: 8px 0 0;
  font-size: 12.5px;
  line-height: 1.55;
  color: var(--vp-c-text-2);
}
</style>
