---
title: Overlay editor
description: Arrange counters precisely, manage interaction and learn the default shortcuts.
---

# Overlay editor

Focus the game and press **Ctrl+Shift+Space** to toggle editing. The tray's **Edit mode** starts capturing input when the game next receives focus; selecting it again cancels a pending edit request.

## Arrange a counter

Click a counter to select it; the first press on an unselected counter selects and moves it. Drag a selected counter's corner handles or the edge/corner bands inside its border to resize. Those bands remain usable when external handles fall off-screen.

The **Counter properties** inspector provides:

| Control        | Behavior                                                                |
| -------------- | ----------------------------------------------------------------------- |
| Title          | Name the placement.                                                     |
| URL            | Change a custom overlay's URL.                                          |
| Enabled        | Hide this placement without discarding its geometry; re-enable it here. |
| X / Y          | Horizontal/vertical position.                                           |
| Width / Height | Content dimensions; minimum 10 px.                                      |
| Scale          | Scale the content; minimum 0.1.                                         |
| Layer          | Stacking order from 0 to 999.                                           |
| Opacity %      | 0–100%; stored as 0–1.                                                  |
| Rotation       | −180° to 180°.                                                          |
| Reset size     | Restore the catalog dimensions (500×300 fallback) and scale 1.          |
| Refresh        | Reload the selected counter.                                            |
| Settings       | Open an installed counter's backend-hosted settings when available.     |
| Remove counter | Delete the placement rather than disable it.                            |

In a focused numeric field, the wheel changes the value by its step; hold **Shift** for ten steps.

### Wheel gestures on the counter

| Pointer location | Wheel behavior                                                |
| ---------------- | ------------------------------------------------------------- |
| Middle           | Change layer.                                                 |
| Edge             | Grow that side by 10 px (up) or shrink it (down).             |
| Corner           | Change scale by 0.05 while keeping the opposite corner fixed. |

Continued scrolling keeps the same edge/corner target until the wheel pauses. Each gesture is one undo step. The right-click menu also offers **Refresh**.

**Settings → General → Keep overlays in view** constrains only the selected overlay during editing. It does not clamp unselected counters or silently save new coordinates when the game window resizes in normal mode.

## Default shortcuts

| Action                     | Default               |
| -------------------------- | --------------------- |
| Toggle edit mode           | Ctrl+Shift+Space      |
| Toggle overlay interaction | Ctrl+I                |
| Hide vosulay               | Unbound               |
| Delete selected counter    | Delete                |
| Leave editing              | Escape                |
| Undo / redo                | Ctrl+Z / Ctrl+Shift+Z |
| Copy / paste overlays      | Ctrl+C / Ctrl+V       |
| Refresh selected overlays  | Ctrl+R                |
| Refresh all overlays       | Ctrl+Shift+R          |
| Profile positions 1–9      | Ctrl+1 through Ctrl+9 |
| Profile position 10        | Ctrl+0                |

Configure the listed configurable actions in **Settings → Shortcuts**. Delete/Escape are editor keys, not configurable hotkey fields. Dialogs and menus may consume Escape first; in an active catalog search it clears the search. Text fields retain their native undo/redo.

Use **Ctrl+I** when you need to interact with the counter's own content rather than arrange it.

## Input and focus

Editing captures the keyboard and pointer only while the game is focused. Normal mode leaves game input alone. Linux shortcuts use the game's input path; Windows registers global hotkeys, but edit toggle acts only with game focus. Windows hide/show can act without game focus.

By default, losing focus leaves editing. Disable **Settings → General → Leave edit mode when the game loses focus** to keep the editor visible while another window is active; capture returns only when the game is focused again. Linux shows the system cursor during editing and temporarily disables relative mouse mode, restoring the game's requested cursor state on release.

Input-capture or browser-heartbeat failures have a five-second safety bound: input is released or vosulay terminates to close its injected connection. Restart the host if needed.

## Saving

Placement changes save automatically; wait for **Saved** rather than leaving a persistent error unnoticed. **Done** finishes editing. Settings changes require **Save** in the Settings dialog. See [Troubleshooting](/vosulay/troubleshooting) for unsaved edits.

Sources: [editing guide](https://github.com/shiruviaa/vosulay/blob/main/README.md#editing-shortcuts-and-tray), [inspector and labels](https://github.com/shiruviaa/vosulay/blob/main/assets/manager.html), [editor actions](https://github.com/shiruviaa/vosulay/blob/main/assets/manager.js).
