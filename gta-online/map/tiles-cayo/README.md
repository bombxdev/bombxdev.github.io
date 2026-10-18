# Cayo Perico overlay

One image per map style (2500×2436, transparent sea around the island), from
[fivenet-app/livemap-tiles](https://github.com/fivenet-app/livemap-tiles) `overlays/cayo-perico/`
(repository license: Apache-2.0). The imagery itself is credited there to:

- `satellite.webp`: [Cayo Perico Satelitte Map V3](https://forum.cfx.re/t/free-cayo-perico-satelitte-map-v3/5260282) by jonstyle83
- `atlas.webp`, `road.webp`, `game.webp`: built from `postal.webp`,
  [Cayo Perico Atlas Postal Map](https://forum.cfx.re/t/cayo-perico-atlas-postal-map-free/5275857) by DZ2024,
  with `tools/build_cayo_styles.py` (postal-code numbers removed, recoloured per style)

Game imagery © Rockstar Games.

## Placement (game coordinates, Leaflet `[lat=y, lng=x]`)

```js
L.imageOverlay('tiles-cayo/satellite.webp', [[-6144.05, 3666.78], [-4144.05, 5723.78]])
```

Bounds are the ones FiveNet uses with the same plain game-coordinate CRS. Checked against
script coordinates on the island: all 50 land points (z > 8) fall on land, 8/9 underwater
points in water; beach-level treasure/stash spots lie ~10–15 m from the drawn shoreline.
