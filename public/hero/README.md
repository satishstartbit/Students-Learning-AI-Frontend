# Home hero layers

Drop the finished PNG assets in this folder:

- `back.png` — sky and far hills
- `mid.png` — green meadow
- `front.png` — wildflowers and grass
- `leaf.png` — leaf branch, positioned in the top left

Export all four on the **same 1672 × 941 canvas**, with matching alignment.
Keep transparency around each painted layer, especially the meadow, flowers,
and branch. Leave a little painted overlap between the landscape planes so
their small movements do not reveal gaps.

The browser requests `/hero/back.png`, `/hero/mid.png`, `/hero/front.png`,
and `/hero/leaf.png` (also respecting Vite's base path). Refresh after adding
the files. Until all four load, the existing watercolor illustration remains
visible with gentle motion; missing files never show broken-image icons.

`HeroParallax.jsx` controls each layer's scroll distance and mouse depth.
Below 768px distances halve and the art stacks below the greeting. Mouse
motion is limited to desktop fine pointers. System/saved reduced motion,
an active or paused focus session, and an open check-in dialog disable motion.
