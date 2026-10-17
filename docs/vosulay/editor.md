---
title: Overlay editor
description: Arrange counters precisely, manage interaction and learn the default shortcuts.
---

# Overlay editor

Focus the game and press **Ctrl+Shift+Space** to toggle editing. The tray's **Edit mode** starts capturing input when the game next receives focus; selecting it again cancels a pending edit request. From a script or a compositor keybind, `vosulay --toggle-edit` does the same as the tray item (see [Settings → Command line](/vosulay/settings#command-line)).

## Arrange a counter

Click a counter to select it; the first press on an unselected counter selects and moves it. Drag a counter's body to move it. A selected counter's corner handles and the edge/corner bands just inside its border change it; the modifier held when you press decides how:

| Drag on an edge or handle | Effect                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| Plain drag                | Resize that side or corner.                                                              |
| **Ctrl**+drag             | Scale; the opposite corner (or the middle of the opposite side) stays fixed.             |
| **Shift**+drag            | Crop that side; the counter's content stays where it is on screen, like Alt+drag in OBS. |

The band under the pointer is highlighted in the color of the edit it would make: purple for resize, blue for scale, amber for crop. The mode is fixed when you press, so pressing or releasing a modifier mid-drag does not change the edit. The bands remain usable when external handles fall off-screen.

Right-click a counter to open its compact inspector; when counters overlap, repeated right-clicks cycle through them. Its header has refresh and close controls, followed by two-column position and size fields, a **Scale / Layer** row and a **Settings / Advanced** row. Hover or focus an icon for its label.

**Advanced** opens the full placement editor with these controls:

| Control          | Behavior                                                                                  |
| ---------------- | ----------------------------------------------------------------------------------------- |
| Title            | Name the placement.                                                                       |
| URL              | Change a custom overlay's URL.                                                            |
| Enabled          | Hide this placement without discarding its geometry; re-enable it here.                   |
| X / Y            | Position of the visible (cropped) area's top-left corner.                                 |
| Width / Height   | Counter frame dimensions before cropping; minimum 10 px.                                  |
| Scale            | Scale the content; minimum 0.1.                                                           |
| Layer            | Stacking order from 0 to 999.                                                             |
| Opacity %        | 0–100%; stored as 0–1.                                                                    |
| Rotation         | −180° to 180°.                                                                            |
| Crop sides       | Counter pixels hidden from the left, right, top and bottom; at least 10 px stays visible. |
| Reset size       | Restore the catalog dimensions (500×300 fallback), scale 1 and no crop.                   |
| Refresh          | Reload the selected counter.                                                              |
| vosu profile pin | Keep this placement on one vosu settings profile rather than following the default.       |
| Remove counter   | Delete the placement with inline confirmation; undo restores it.                          |

The mouse wheel changes the inspector field under the pointer by its step, without clicking into it; hold **Shift** for ten steps. Scrolling one field is one undo step. The wheel over a counter itself does nothing. The right-click menu also offers **Refresh**.

The compact inspector's **Settings** button opens vosulay's native settings editor when vosu
provides settings profiles. It supports search, section navigation, saving values and profile
management; see [Counter settings](/vosulay/overlays#counter-settings). Other compatible backends
open the counter's settings in your browser.

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
