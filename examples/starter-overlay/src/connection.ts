export type ObjectValue = Record<string, unknown>;

const emptyObject: ObjectValue = Object.freeze({});

export function object(value: unknown): ObjectValue {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as ObjectValue)
    : emptyObject;
}

export const pointers = [
  "/play/pp/current",
  "/play/accuracy",
  "/play/combo/current",
  "/play/hits",
  "/keys",
  "/play/pressHitErrors",
  "/play/releaseHitErrors",
  "/play/hitErrorArray",
  "/beatmap/stats/hitWindow",
];

export const allFields = (1 << pointers.length) - 1;

// Decode once, not for every full-document fallback message.
const tokens = pointers.map((pointer) =>
  pointer
    .slice(1)
    .split("/")
    .map((token) => token.replace(/~1/g, "/").replace(/~0/g, "~")),
);

export function readPointer(document: unknown, path: readonly string[]): unknown {
  let value = document;
  for (const token of path) {
    if (Array.isArray(value)) {
      if (!/^(0|[1-9][0-9]*)$/.test(token)) return undefined;
      value = value[Number(token)];
    } else {
      value = object(value)[token];
    }
  }
  return value;
}

// Full-stream fallback values are fresh JSON objects: reference equality is not enough.
function sameValue(left: unknown, right: unknown): boolean {
  if (Object.is(left, right)) return true;
  if (!left || !right || typeof left !== "object" || typeof right !== "object") return false;
  if (Array.isArray(left)) {
    if (!Array.isArray(right) || left.length !== right.length) return false;
    for (let index = 0; index < left.length; index++) {
      if (!sameValue(left[index], right[index])) return false;
    }
    return true;
  }
  if (Array.isArray(right)) return false;
  const a = left as ObjectValue;
  const b = right as ObjectValue;
  for (const key in a) {
    if (Object.hasOwn(a, key) && (!Object.hasOwn(b, key) || !sameValue(a[key], b[key]))) {
      return false;
    }
  }
  for (const key in b) {
    if (Object.hasOwn(b, key) && !Object.hasOwn(a, key)) return false;
  }
  return true;
}

declare global {
  interface Window {
    COUNTER_PATH?: string;
  }
}

export function socketUrl(path: string): string {
  const query = new URLSearchParams(location.search);
  // Explicit override is useful on Vite's dev server or a separate preview server.
  const override = query.get("daemon");
  // Vite injects the counter name too, but its dev server is not the telemetry daemon.
  const hosted =
    !import.meta.env.DEV && (typeof window.COUNTER_PATH === "string" || location.port === "24050");
  const host = override || (hosted ? location.host : "127.0.0.1:24050");
  const scheme = !override && hosted && location.protocol === "https:" ? "wss:" : "ws:";
  return `${scheme}//${host}${path}`;
}

function delay(attempt: number): number {
  return Math.min(5000, 250 * 2 ** Math.min(attempt, 5));
}

export class Telemetry {
  readonly values: unknown[] = Array.from({ length: pointers.length });
  private socket: WebSocket | null = null;
  private precise: WebSocket | null = null;
  private timer = 0;
  private handshake = 0;
  private attempt = 0;
  private revision = -1;
  private stopped = false;

  constructor(
    private readonly onData: (values: unknown[], changed: number) => void,
    private readonly onStatus: (status: string) => void,
  ) {
    this.connect(true);
  }

  private connect(subscribe: boolean): void {
    if (this.stopped) return;
    this.values.fill(undefined);
    this.revision = -1;
    this.onData(this.values, allFields);
    const socket = new WebSocket(
      socketUrl(subscribe ? "/websocket/v2/subscribe" : "/websocket/v2"),
    );
    this.socket = socket;
    let received = false;
    this.onStatus(subscribe ? "Connecting to vosu…" : "Connecting to full v2…");
    if (subscribe) {
      // A server that silently ignores an unknown route must not stall forever.
      this.handshake = window.setTimeout(() => socket.close(), 4500);
    }
    socket.onopen = () => {
      if (subscribe) socket.send(JSON.stringify(pointers));
      else this.connectPrecise();
    };
    socket.onmessage = (event) => {
      if (this.socket !== socket || typeof event.data !== "string") return;
      let frame: unknown;
      try {
        frame = JSON.parse(event.data);
      } catch {
        return;
      }
      let changed = 0;
      if (subscribe) {
        if (!Array.isArray(frame)) return;
        if (frame[0] === 2) {
          this.onStatus(`Subscription error ${frame[1]}: ${frame[2]}`);
          socket.close();
          return;
        }
        if ((frame[0] !== 0 && frame[0] !== 1) || typeof frame[1] !== "number") return;
        if (frame[1] <= this.revision || !Array.isArray(frame[2])) return;
        if (!received && frame[0] !== 0) return;
        this.revision = frame[1];
        if (frame[0] === 0) {
          this.values.fill(undefined);
          changed = allFields;
        }
        for (const pair of frame[2]) {
          if (
            Array.isArray(pair) &&
            Number.isInteger(pair[0]) &&
            pair[0] >= 0 &&
            pair[0] < pointers.length
          ) {
            this.values[pair[0]] = pair[1];
            changed |= 1 << pair[0];
          }
        }
        if (frame[0] === 1 && Array.isArray(frame[3])) {
          for (const index of frame[3]) {
            if (Number.isInteger(index) && index >= 0 && index < pointers.length) {
              this.values[index] = undefined;
              changed |= 1 << index;
            }
          }
        }
      } else {
        if (!frame || Array.isArray(frame) || typeof frame !== "object" || "error" in frame) return;
        for (let index = 0; index < tokens.length; index++) {
          // Upstream tosu supplies keys on its precise stream, not regular v2.
          if (index === 4 && !("keys" in frame)) continue;
          changed |= this.compareFallback(index, readPointer(frame, tokens[index]));
        }
      }
      received = true;
      this.attempt = 0;
      clearTimeout(this.handshake);
      this.onStatus(subscribe ? "vosu subscription" : "Full v2 fallback");
      if (changed !== 0) this.onData(this.values, changed);
    };
    socket.onerror = () => socket.close();
    socket.onclose = () => {
      if (this.socket !== socket || this.stopped) return;
      clearTimeout(this.handshake);
      this.socket = null;
      this.closePrecise();
      if (subscribe && !received) {
        this.connect(false);
      } else {
        this.onStatus("Disconnected; retrying…");
        // Re-probe vosu on reconnect, even if the previous server was tosu.
        this.timer = window.setTimeout(() => this.connect(true), delay(this.attempt++));
      }
    };
  }

  private compareFallback(index: number, value: unknown): number {
    if (sameValue(this.values[index], value)) return 0;
    this.values[index] = value;
    return 1 << index;
  }

  private connectPrecise(): void {
    const socket = new WebSocket(socketUrl("/websocket/v2/precise"));
    this.precise = socket;
    socket.onmessage = (event) => {
      if (this.precise !== socket || typeof event.data !== "string") return;
      try {
        const data = object(JSON.parse(event.data));
        if (data.keys) {
          const changed = this.compareFallback(4, data.keys);
          if (changed !== 0) this.onData(this.values, changed);
        }
      } catch {
        // Keep the last usable state until another message arrives.
      }
    };
    socket.onerror = () => socket.close();
    socket.onclose = () => {
      if (this.precise !== socket || this.stopped) return;
      // Reconnect both fallback streams together; never accumulate retries.
      this.socket?.close();
    };
  }

  private closePrecise(): void {
    const socket = this.precise;
    this.precise = null;
    socket?.close();
  }

  close(): void {
    this.stopped = true;
    clearTimeout(this.timer);
    clearTimeout(this.handshake);
    this.closePrecise();
    const socket = this.socket;
    this.socket = null;
    socket?.close();
  }
}

export class SettingsChannel {
  private socket: WebSocket | null = null;
  private timer = 0;
  private attempt = 0;
  private stopped = false;
  private readonly path = window.COUNTER_PATH || "starter-overlay";

  constructor(private readonly onSettings: (settings: ObjectValue) => void) {
    this.connect();
  }

  private connect(): void {
    if (this.stopped) return;
    const encoded = encodeURIComponent(this.path);
    const socket = new WebSocket(socketUrl(`/websocket/commands?l=${encoded}`));
    this.socket = socket;
    socket.onopen = () => socket.send(`getSettings:${encoded}`);
    socket.onmessage = (event) => {
      if (this.socket !== socket || typeof event.data !== "string") return;
      try {
        const envelope = object(JSON.parse(event.data));
        const settings = object(envelope.message);
        if (
          (envelope.command === "getSettings" || envelope.command === "updateSettings") &&
          !envelope.error &&
          !settings.error
        ) {
          this.attempt = 0;
          this.onSettings(settings);
        }
      } catch {
        // Ignore non-JSON responses, without buffering them.
      }
    };
    socket.onerror = () => socket.close();
    socket.onclose = () => {
      if (this.socket !== socket || this.stopped) return;
      this.socket = null;
      this.timer = window.setTimeout(() => this.connect(), delay(this.attempt++));
    };
  }

  close(): void {
    this.stopped = true;
    clearTimeout(this.timer);
    const socket = this.socket;
    this.socket = null;
    socket?.close();
  }
}
