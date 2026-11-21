# Task: best-stealth-game-20261121-1759 entry — make.fun bounty ($50, closes 2026-11-22T05:59:00 UTC)
# make.fun BUNDLE mode: build everything + git push here; parent bundles + submits after. Never ask questions. Do NOT submit, do NOT pay, never print API keys.

Build the best stealth game as a static web app under game/. Zero network at runtime. Opens in desktop Chrome, works offline.

REPO: C:/Users/Kaz/makefun-bounties/entries/best-stealth-game-20261121-1759 — completely empty. Create everything from scratch.
Kit: C:/Users/Kaz/makefun-bounties/best-stealth-game-20261121-1759-kit/best-stealth-game-20261121-1759-kit — read RULES.txt fully first.

RESOURCES
- gh: C:/Users/Kaz/AppData/Local/Programs/gh/bin/gh.exe
- Python+Pillow: C:/Users/Kaz/AppData/Local/hermes/tools/youtube-venv/Scripts/python.exe
- Node on PATH
- Browser: browser_exec (fresh named session) for screenshots
- Keypair: C:/Users/Kaz/makefun-bounties/makefun-keypair.json (wallet 5bUR9FL3rTeevwqZC97oH7agHyQqJD9H6C2jW4DGcLUk)

CONCEPT: top-down stealth game on canvas. Player sneaks past patrolling guards with vision cones, hides in shadows, collects an objective and reaches the exit. Detection meter, guard AI patrol routes, win/lose states, restart. All drawn with Canvas API, no external assets, deterministic.

STEPS (in this session, in order)
1. cd C:/Users/Kaz/makefun-bounties/entries/best-stealth-game-20261121-1759
2. Inspect C:/Users/Kaz/makefun-bounties/best-stealth-game-20261121-1759-kit/best-stealth-game-20261121-1759-kit/starter/ — read starter/main.ts, starter/vendor/makefun-game.ts, starter/game/index.html, starter/shots.json.
3. Write game/index.html: canvas, HUD (detection meter, objective), start/win/lose overlays, restart.
4. Write game/styles.css: dark stealth theme, HUD, overlays.
5. Write game/js/level.js: tile map (walls, shadows, exit, objective), deterministic layout.
6. Write game/js/guards.js: patrol waypoints, vision cone rendering, detection logic (line-of-sight + distance + shadow).
7. Write game/js/player.js: movement (WASD/arrows), sneak, collision, hide-in-shadow.
8. Write game/js/game.js: loop, detection meter, win (objective+exit) / lose (detected), restart.
9. Copy C:/Users/Kaz/makefun-bounties/best-stealth-game-20261121-1759-kit/best-stealth-game-20261121-1759-kit/vendor/makefun-game.ts VERBATIM to C:/Users/Kaz/makefun-bounties/entries/best-stealth-game-20261121-1759/vendor/makefun-game.ts
10. Write main.ts at root: copies game/ + screenshots/ to MAKEFUN_OUTPUT_DIR ?? /output, writes dossier.json with buildDossier from vendor/makefun-game.ts (pattern from starter/main.ts).
11. LICENSE: MIT text WITH `SPDX-License-Identifier: MIT`.
12. .makefun/owner.json: {"wallet": "5bUR9FL3rTeevwqZC97oH7agHyQqJD9H6C2jW4DGcLUk"}
13. .gitignore: out/, __pycache__/
14. Serve game/ locally, open in browser, play: verify movement, guard detection, win and lose both reachable.
15. Take 3-4 screenshots with browser_exec: start, mid-sneak near a guard vision cone, win, lose. Save to screenshots/. Verify each <=256 KiB, long side <=1280, short side >=480 with Pillow.
16. Test main.ts: mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts; verify out/dossier.json + screenshots copied.
17. Git init -b main, git add -A, commit, push.
18. Create PUBLIC GitHub repo djkaz97-cmd/best-stealth-game-20261121-1759 if not exists: gh repo create --public --source C:/Users/Kaz/makefun-bounties/entries/best-stealth-game-20261121-1759 --push --homepage https://make.fun/bounty/best-stealth-game-20261121-1759 (or git push origin main if exists).
19. gh repo edit --add-topic makefun,ai-agents,bounties,growth.
20. README.md: title + 3 live make.fun badges for best-stealth-game-20261121-1759 (owner djkaz97-cmd, repo best-stealth-game-20261121-1759):
    [![make.fun · best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
    [![rank](https://make.fun/badge/best-stealth-game-20261121-1759/djkaz97-cmd/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
    [![reward](https://make.fun/badge/best-stealth-game-20261121-1759/djkaz97-cmd/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759?utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759)
21. AGENTS.md: rewrite this file in your own words.
22. Do NOT submit — parent handles it (BUNDLE mode).

FINAL REPORT: commit sha, repo URL, screenshots list, game concept, blockers. Do NOT submit.
