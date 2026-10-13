import { allFields, object, SettingsChannel, Telemetry } from "./connection";
import "./style.css";

function element(id: string): HTMLElement {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing element: ${id}`);
  return node;
}

const pp = element("pp");
const accuracy = element("accuracy");
const combo = element("combo");
const hits = element("hits");
const timing = element("timing");
const keys = element("keys");
const status = element("status");
const keyNames = ["k1", "k2", "m1", "m2"];
// Fixed DOM capacity: no growing history and no per-message element construction.
const keyNodes: HTMLElement[] = [];
for (let index = 0; index < 18; index++) {
  const node = document.createElement("span");
  node.className = "key";
  node.hidden = true;
  keys.append(node);
  keyNodes.push(node);
}

function number(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function latest(value: unknown): string {
  if (!Array.isArray(value) || value.length === 0) return "—";
  const last = value[value.length - 1];
  return typeof last === "number" && Number.isFinite(last) ? `${last.toFixed(1)} ms` : "—";
}

let values: unknown[] = [];
let pending = 0;
let statusText = "Connecting…";
let dirty = allFields;
let statusDirty = true;

function render(): void {
  pending = 0;
  const changed = dirty;
  dirty = 0;
  // Subscribe indices are already change events; do not re-diff their values or DOM.
  if (changed & 1) pp.textContent = number(values[0]).toFixed(0);
  if (changed & 2) accuracy.textContent = `${number(values[1]).toFixed(2)}%`;
  if (changed & 4) combo.textContent = `${number(values[2])}×`;
  if (changed & 8) {
    const counts = object(values[3]);
    hits.textContent = `300: ${number(counts["300"])} · 100: ${number(counts["100"])} · 50: ${number(counts["50"])} · miss: ${number(counts["0"])} · geki: ${number(counts.geki)} · katu: ${number(counts.katu)}`;
  }
  if (changed & 480) {
    // Indices 5–8 share a timing row. An empty press array is not missing.
    const presses = Array.isArray(values[5]) ? values[5] : values[7];
    const window = object(values[8]);
    const great =
      typeof window.great === "number" && window.great > 0 ? `${window.great.toFixed(1)} ms` : "—";
    timing.textContent = `Press: ${latest(presses)} · Release: ${latest(values[6])} · Great window: ${great}`;
  }
  if (changed & 16) {
    const source = object(values[4]);
    const all = Array.isArray(source.all) && source.all.length > 0 ? source.all : null;
    const length = Math.min(all ? all.length : keyNames.length, keyNodes.length);
    for (let index = 0; index < keyNodes.length; index++) {
      const node = keyNodes[index];
      node.hidden = index >= length;
      if (node.hidden) continue;
      const key = object(all ? all[index] : source[keyNames[index]]);
      const name = all && typeof key.name === "string" ? key.name : keyNames[index];
      node.textContent = `${name} ${number(key.count)}`;
      node.classList.toggle("pressed", key.isPressed === true);
    }
  }
  if (statusDirty) {
    status.textContent = statusText;
    statusDirty = false;
  }
}

function schedule(): void {
  if (pending === 0) pending = requestAnimationFrame(render);
}

const telemetry = new Telemetry(
  (next, changed) => {
    values = next;
    dirty |= changed;
    schedule();
  },
  (next) => {
    if (statusText !== next) {
      statusText = next;
      statusDirty = true;
      schedule();
    }
  },
);

const settings = new SettingsChannel((next) => {
  if (typeof next.accent === "string" && /^#[0-9a-f]{6}$/i.test(next.accent)) {
    const style = document.documentElement.style;
    if (style.getPropertyValue("--accent") !== next.accent) {
      style.setProperty("--accent", next.accent);
    }
  }
  const hidden = next.showKeys === false || next.showKeys === "false";
  if (keys.hidden !== hidden) keys.hidden = hidden;
});

window.addEventListener("pagehide", () => {
  telemetry.close();
  settings.close();
  cancelAnimationFrame(pending);
});
