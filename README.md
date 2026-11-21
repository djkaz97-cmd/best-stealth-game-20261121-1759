# best-stealth-game-20261121-1759

[![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/best-stealth-game-20261121-1759/djkaz97-cmd/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/best-stealth-game-20261121-1759/djkaz97-cmd/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)

**HOLLOWLIGHT** is a top-down stealth game about carrying one stolen lantern past a house of watchmen before dawn. Three hand-built floors of the Hollowlight Archive: a colonnaded atrium, a long gallery of display cases, and the four-door Ember Vault. Lantern cones reveal you, shadow pools hide you, crates and pillars break line of sight, and footsteps carry — the watch's steps are panned left and right so you hear a patrol before you see it. Get seen and the meter fills, but a near miss is survivable: break sight, let suspicion fall, and the watch returns to its round.

Everything is drawn with the Canvas 2D API and every sound is synthesised with the Web Audio API. There are no images, fonts, samples, libraries or network requests: the game is `index.html`, `styles.css` and a handful of ES modules that a static server hands over offline.

## How it plays

- **WASD / arrows** walk. **Shift** sneaks: slower, quieter, harder to see.
- **E** lifts the Emberglass from its pedestal; carry it to the **night door** to clear the floor.
- Guards walk learned routes and pause to sweep their lantern. A guard who half-sees you stops and stares (`?`); a guard who is sure hunts you (`!`) and raises the alarm. Break line of sight to lose them.
- Walking makes noise; a nearby guard comes to look. Sneaking keeps your steps to yourself.
- Shadow pools hide you completely past a lantern's close range, and cut your visibility inside it.
- **R** resets the floor, **Esc** pauses, **1 2 3** jump to a floor, **M** mutes.

## Run it

```sh
node serve.ts
```

Then open <http://localhost:8080>. Any static server works: serve `game/` at its root with no build step. The entry itself is handed in with:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `game/` and `screenshots/` into the output directory and writes `dossier.json` with the vendored `vendor/makefun-game.ts`.

## Layout

```
game/
  index.html        the canvas, the HUD and the four screens
  styles.css        archival-noir theme, HUD and overlays
  js/config.js      canvas geometry, palette and the feel constants
  js/level.js       the three floors, their grids and the Level queries
  js/vision.js      lantern ray casts, cone polygons and line of sight
  js/guards.js      patrol, suspect, alert, search and return states
  js/player.js      movement, sneak, collision and shadow hiding
  js/game.js        the loop, suspicion, alarm, prize, night door, restart
  js/render.js      the floor bake, cones, watchmen, courier and effects
  js/hud.js         detection meter, objective, timer, screens
  js/audio.js       synthesised footsteps, heartbeat, alarm and stings
  js/input.js       keyboard state with one-shot edges
  js/shots.js       the four named poses the screenshots were taken from
  js/utils.js       angles, distances, deterministic grain, collision moves
screenshots/        1-atrium, 2-gallery, 3-vault, 4-alert
```

## Credits

Game, art, names and sound are original to this entry, made for make.fun's *Make the best stealth game* bounty. Code is MIT licensed.
