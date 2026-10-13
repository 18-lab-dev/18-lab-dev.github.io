---
title: "5. Declare read-only settings"
description: "Expose the same accent and key visibility controls in vosu and tosu."
---

# 5. Declare read-only settings

Add both schema files to `public/`. Vite copies them as regular files into the
counter folder on every build. Keep their `uniqueID`, type, and default values
synchronized: the same JavaScript consumes either server's values.

## vosu: settings.schema.toml

<<< ../../../../examples/starter-overlay/public/settings.schema.toml

vosu treats this package-owned schema as authoritative and keeps mutable values in
its central settings directory. A package should not ship the user's saved values.

## tosu: settings.json

<<< ../../../../examples/starter-overlay/public/settings.json

This JSON array is tosu's schema, not a flat runtime values object. Shipping both files
lets each daemon use its own schema format. The overlay callback instead receives a
flat object such as `{ "accent": "#8fe3cf", "showKeys": true }`.

## Read the commands channel

`SettingsChannel` in step 2 reads `window.COUNTER_PATH`, URL-encodes it, and opens:

```text
/websocket/commands?l=<encoded counter path>
```

On open it sends `getSettings:<encoded counter path>`. On `getSettings` and
`updateSettings` envelopes it passes `message` to the callback. The callback in
`src/main.ts` validates a six-digit hex accent and accepts checkbox booleans or the
string `"false"`. An error reply is ignored, preserving the built-in defaults.
The Vite serve-only plugin injects the package name too, so HMR uses the same settings
identity. Build/install the counter once so the daemon can find its schema; a Vite
page alone does not install counter settings. Unhosted previews default to
`starter-overlay`.

The channel has one reconnect timer and sends the request only after open. It does
not keep a retry queue. `pagehide` closes it along with the telemetry sockets.

## Let users edit the hosted page

Users open the counter's settings from the daemon dashboard. Both servers expose a
hosted `/settings?overlay=starter-overlay` page. Saving there sends updates back to
the overlay; your UI does not need its own settings editor.

::: warning Read, do not manage
The overlay must not send `saveSettings`, call privileged management endpoints, or
write schema files. Keep configuration changes on the hosted settings page.
Read [security](/vosu/dev/security) before adding any management capability.
:::

::: warning Deprecated: /api/ingame and __ingame__
Do not use tosu's deprecated `/api/ingame` or `__ingame__` settings; use vosulay for
in-game placement and ordinary counter settings for customization.
:::

Sources: [vosu settings](https://github.com/shiruviaa/vosu/blob/main/src/counters/settings.rs),
[vosu commands](https://github.com/shiruviaa/vosu/blob/main/src/server/commands.rs),
[tosu settings parser](https://github.com/tosuapp/tosu/blob/master/packages/server/utils/parseSettings.ts),
[tosu commands](https://github.com/tosuapp/tosu/blob/master/packages/server/utils/commands.ts).

Next: [package and test](/vosu/dev/tutorial/06-package).
