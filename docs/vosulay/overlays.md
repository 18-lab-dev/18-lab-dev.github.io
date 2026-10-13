---
title: Add and configure overlays
description: Discover backend counters or add trusted URL and local HTML overlays.
---

# Add and configure overlays

## Installed counters

vosulay reads the installed counter catalog from your separately running backend. Install counters in [vosu](/vosu/guide/overlays) or your tosu-compatible backend, then open the in-game editor.

Use **Search counters** to match a counter's name, author or folder. Click a catalog entry to add a placement. Adding the same counter again is supported; placements are not deduplicated.

A counter can depend on backend-specific endpoints. For example, vosu's selected-field `/websocket/v2/subscribe` is unavailable in tosu; a counter relying on it may remain empty and reconnect there. Changing renderer settings does not provide a missing backend API.

## Counter settings

Select an installed counter and use **Settings** in **Counter properties** when that counter advertises settings. This opens the configured backend's `/settings?overlay=<counter ID>` page in your external browser. Settings belong to the backend/counter, not the layout inspector.

For vosu, see [overlay settings](/vosu/guide/overlays). The inspector's geometry, opacity, rotation and enabled state remain vosulay placement settings. Custom URLs do not get the installed-counter settings action.

## Custom URL

Click **Add URL**, enter a **Title** and HTTP(S) **URL**, then click **Add**. Use the inspector's **URL** field to change a custom placement later.

Custom overlays on unrelated HTTP(S) origins load directly. Their scripts and resources may contact other services: the configured backend is not an outbound-network allowlist.

## Local HTML

Click **HTML file** and select the overlay's HTML entry point. vosulay creates a `vosulay-overlay://` capability URL for its canonical parent directory and descendants, allowing relative assets to load. It rejects traversal and symlink escapes and serves only readable regular files up to 32 MiB.

::: danger Use a dedicated overlay directory
Local authorization covers the HTML file's **parent directory and descendants**, not only the selected file. Keep private files out of that directory. Authorized remote clients can also retrieve resources under saved overlay roots. Do not publish local capability URLs as if they were harmless filenames.
:::

## Refresh, disable or remove

- **Refresh** reloads a counter; **Ctrl+R** refreshes selected overlays and **Ctrl+Shift+R** refreshes the active profile's overlays.
- Uncheck **Enabled** to hide a placement without deleting its settings.
- **Remove counter** or **Delete** removes the selected placement.

See [Editor](/vosulay/editor) for placement controls.

::: warning Trust the content
Counters and custom pages execute JavaScript inside CEF's sandboxed renderer. Third-party scripts can send data to their own destinations. **Allow unrestricted SharedArrayBuffer** is off by default; enabling it weakens a Chromium Spectre mitigation for every overlay and requires restart. Enable it only if you fully trust all loaded content.

Counters cannot make edits: [local editing](/vosulay/remote#edit-from-obs-or-a-local-browser) lives on a separate `manage.localhost` address whose routes counters cannot reach, and a page can only add local HTML files you chose in a file dialog.
:::

Sources: [integrations](https://github.com/shiruviaa/vosulay/blob/main/docs/integrations.md), [security disclosure](https://github.com/shiruviaa/vosulay/blob/main/docs/security.md), [hosted settings action](https://github.com/shiruviaa/vosulay/blob/main/src/runtime/editor.rs).
