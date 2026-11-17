// Bloomkeeper — the hand-in program (Node 22, standard library only).
//
// The game itself is the static site in game/: it needs no build and opens
// offline in a browser. This program is what an entry hands in — it copies
// game/ and screenshots/ into the output directory and writes the dossier
// the judge reads, using the vendored make.fun library so the dossier is
// byte for byte the one the scorer rebuilds.
//
// Run it the way the grader does, with an output directory of your own:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const repoDir = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoDir, 'game'), join(outputDir, 'game'), { recursive: true });

const shotsDir = join(repoDir, 'screenshots');
if (existsSync(shotsDir)) {
  cpSync(shotsDir, join(outputDir, 'screenshots'), { recursive: true });
}

// The caps are the gate's own (see the kit's RULES.txt): at most four
// screenshots of 256 KiB, at most 993 entries and 48 MiB under game/, and
// the dossier text capped at 160 KiB. Passing them here means this program
// fails loudly on the same entries the scorer would refuse.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
