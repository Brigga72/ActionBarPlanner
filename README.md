# ActionBarPlanner

[Open the planner](https://brigga72.github.io/ActionBarPlanner/)

Based on [Barsmith by rubensayshi](https://github.com/rubensayshi/wowforever-barplanner), with a visual layout editor. Original MIT license retained in LICENSE.

## Visual layout

Click **Edit layout**, drag the labeled handles to move bars, drag the gold corners to resize buttons, and use **Bar / Rows** to wrap a bar. Click **Done editing** to place spells normally. Arrow keys work on move and resize handles. **Reset layout** restores the original arrangement.

Plans and layouts are stored per browser. BP1 exports transfer spells, macros, keybinds and planner layouts: bar visibility, positions, button size/scale, visible button counts and rows. Load restores the layout in the planner. Older strings still load, inferring visible bars from their slots.

The bundled addon ignores the optional layout records. Apply handles action slots, macros and keybinds only; it does not move, resize, wrap or hide in-game bars. In-game visual arrangement support has not been verified. Configure your bar addon separately.

### Optional BP1 records

The BP1 prefix and BARPLAN version 1 remain unchanged. Tab-separated `SHOWN` records list visible action-bar keys. `LAYOUT` fields are `key, x, y, size, baseSize, buttons, rows` (tab separated). Positions are screen fractions; sizes are button pixels; scale is size/baseSize. Keys are b1 through b8, pet or stance. Invalid layout records are ignored. Older readers ignore these records; exporting from the game does not retain them.

Run regression tests: `node --test tests/plan-layout.test.cjs`.

## Hosting

GitHub Actions publishes the planner and builds Barsmith.zip from addon/Barsmith on each push to main. No server or database is needed. Icons and spell tooltips use third-party services.
