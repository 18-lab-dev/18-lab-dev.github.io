---
title: Profiles
description: Create, rename, reorder and switch saved overlay layouts.
---

# Profiles

A profile holds an ordered set of overlay placements. The initial **Default** profile is empty. The same counter may appear more than once; each placement retains its own geometry, enabled state and appearance.

## Create and switch

Enter [edit mode](/vosulay/editor). Use **+** (**Add profile**), enter a **Profile name**, then click **Create**. Choose an existing layout from the **Profile** picker.

Default keyboard switches are **Ctrl+1** through **Ctrl+9** for positions 1–9, and **Ctrl+0** for position 10. They follow list position, not the profile's name or ID. Customize them in **Settings → Shortcuts → Switch profile**.

## Rename and reorder

Open **More profile actions** (the three-line menu), then **Rename**. Enter the new name; **Enter** commits and **Escape** cancels. Leaving the rename field also commits the change.

Use **Position** in the same menu to reorder the active profile. This changes both keyboard position mapping and the remote page's `?profile=N` selection. See [Remote profiles](/vosulay/remote).

The **−** (**Delete profile**) button opens a confirmation; choose **Delete** or **Cancel**. Placement edits and profile changes save automatically: watch for **Saved** in the toolbar.

## Import and export

**More profile actions → Export…** exports the active profile to JSON. **Import…** imports a profile JSON. Keep exported files if you want a separate backup before changing or removing your [configuration](/vosulay/settings#configuration-files).

For a tosu layout, use **Settings → tosu layout → Import tosu layout** and select `settings/__ingame__.values.json` (legacy layouts are also supported). The import appends profiles, resolves ID collisions and leaves your profiles and the source file unchanged. Pending edits must save successfully before import proceeds; native file picking releases game input.

Automatic tosu import occurs only with an untouched/default configuration and exactly one detected source. It preserves profile names/identities, selected profile, repeated counters, geometry, scale, stacking, safe HTTP(S) custom URLs and enabled state. New opacity/rotation values start at 1/0. Existing custom profiles or settings are not automatically overwritten.

::: info Local remote editing is placement-only
An editable loopback profile page saves placements for the profile it displays. Profile management, app settings and adding local HTML files remain in the in-game editor.
:::

Sources: [profile controls](https://github.com/shiruviaa/vosulay/blob/main/assets/manager.html), [profile shortcuts and rename](https://github.com/shiruviaa/vosulay/blob/main/assets/manager.js), [tosu import](https://github.com/shiruviaa/vosulay/blob/main/README.md#importing-tosu-layouts).
