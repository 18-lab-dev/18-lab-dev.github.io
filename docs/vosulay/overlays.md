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

Select an installed counter and use the compact inspector's **Settings** button. With vosu's
settings-profile catalog, vosulay 1.4.0 opens a **native editor in its Settings modal**, not an
embedded dashboard. Search settings, jump between sections, edit values and **Save** to vosu.

**This placement uses** selects and pins a vosu settings profile for this placement. Choose
**Default profile** to follow vosu's current default; selecting a named profile does not change
that default. The menu creates an empty profile, copies, renames, deletes or **Set as default**;
markers identify vosu's default. Creating or renaming from this menu pins the current placement.
Deleting its profile unpins it. Other placements whose pinned profile was renamed or deleted
are marked missing and reload using vosu's default; refresh view-only OBS/browser pages yourself.

With read-only backend access, values still load with disabled inputs. The reported reason and
**Retry** replace **Save**; profile mutations are disabled, but choosing a profile for a placement
remains available. **Retry** refreshes capabilities after write access is restored; read-only
access never silently opens a browser instead.

**Open in vosu dashboard** is an explicit browser action. With tosu, older vosu, or a backend
without the settings-profile catalog, **Settings** instead opens the counter's settings page
in your browser. Custom URLs do not get the installed-counter settings action.

Settings belong to the backend/counter, not the layout. Pins are placement properties saved and
undone with normal layout edits; pinned placements show the profile after their name. Copying
placements between vosulay profiles preserves their pins. Geometry, opacity, rotation and enabled
state remain vosulay settings. For vosu, see [overlay settings](/vosu/guide/overlays).

## Custom URL

Click **Add URL**, enter a **Title** and HTTP(S) **URL**, then click **Add**. Use **Advanced → URL** in the full placement editor to change a custom placement later.

Custom overlays on unrelated HTTP(S) origins load directly. Their scripts and resources may contact other services: the configured backend is not an outbound-network allowlist.

## Local HTML

Click **HTML file** and select the overlay's HTML entry point. vosulay creates a `vosulay-overlay://` capability URL for its canonical parent directory and descendants, allowing relative assets to load. It rejects traversal and symlink escapes and serves only readable regular files up to 32 MiB.

::: danger Use a dedicated overlay directory
Local authorization covers the HTML file's **parent directory and descendants**, not only the selected file. Keep private files out of that directory. Authorized remote clients can also retrieve resources under saved overlay roots. Do not publish local capability URLs as if they were harmless filenames.
:::

## Refresh, disable or remove

- **Refresh** reloads a counter; **Ctrl+R** refreshes selected overlays and **Ctrl+Shift+R** refreshes the active profile's overlays.
- Uncheck **Enabled** in the full placement editor to hide a placement without deleting its settings.
- Remove it from **Advanced** with inline confirmation, or use **Delete**; undo restores it.

See [Editor](/vosulay/editor) for placement controls.

::: warning Trust the content
Counters and custom pages execute JavaScript inside CEF's sandboxed renderer. Third-party scripts can send data to their own destinations. **Allow unrestricted SharedArrayBuffer** is off by default; enabling it weakens a Chromium Spectre mitigation for every overlay and requires restart. Enable it only if you fully trust all loaded content.

Counters cannot make edits: [local editing](/vosulay/remote#edit-from-obs-or-a-local-browser) lives on a separate `manage.localhost` address whose routes counters cannot reach, and a page can only add local HTML files you chose in a file dialog.
:::

Sources: [vosulay 1.4.0 editing and settings](https://github.com/shiruviaa/vosulay/blob/d2e472a/README.md#editing-shortcuts-and-tray), [integrations](https://github.com/shiruviaa/vosulay/blob/main/docs/integrations.md), [security disclosure](https://github.com/shiruviaa/vosulay/blob/main/docs/security.md).
