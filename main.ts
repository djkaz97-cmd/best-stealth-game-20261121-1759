// HOLLOWLIGHT — hand-in program for make.fun's best-stealth-game bounty.
//
// The game itself is game/ : plain static files (index.html, styles.css and ES modules)
// that a desktop browser opens with no build step and no network request. This program
// copies game/ and screenshots/ beside it into the output directory and writes
// dossier.json there with buildDossier from the vendored make.fun library, exactly as
// the scorer recomputes it.
//
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// Play it locally with: node serve.ts   (then open http://localhost:8080)

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repo = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(out, { recursive: true });
cpSync(join(repo, 'game'), join(out, 'game'), { recursive: true });

const shots = join(repo, 'screenshots');
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(shots)) cpSync(shots, join(out, 'screenshots'), { recursive: true });

// The caps are the scorer's own: the dossier's source text stops at 160 KiB, an entry
// carries at most 4 screenshots of 256 KiB each, and game/ stays under 993 entries and
// 48 MiB with every path under 1,000 UTF-8 bytes.
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});

writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`hand-in written to ${out} (dossier.json ${Buffer.byteLength(dossier)} bytes)`);
