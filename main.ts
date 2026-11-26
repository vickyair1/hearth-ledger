// HearthLedger — the entrypoint (Node 22, standard library only).
// The site itself is the static files in app/ (index.html, ES modules, CSS, no build
// step, nothing loaded over the network); this program hands it in. It copies app/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json, the
// summary the judge reads (your screenshots, the first load's files and bytes, and your
// source), using the vendored make.fun library. Leave vendor/makefun-frontend.ts alone:
// the scorer requires dossier.json to be byte for byte what its own copy writes.
//
// Re-authored 27 Nov 2026, after the competition opened: the entrypoint now refuses to
// hand in an entry whose screenshots are missing, instead of silently copying an empty
// screenshots folder and letting the judge fail it. Screenshots are re-taken in the same
// session as the re-authored code, so the dossier always matches the shipped app.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// A missing screenshots folder used to slip through as an empty copy; fail loudly instead.
if (!existsSync(join(here, 'screenshots'))) throw new Error('screenshots/ is missing — take the 4 screenshots before running main.ts');
if (!existsSync(join(here, 'app'))) throw new Error('app/ is missing — nothing to hand in');

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes the bytes; the others refuse an entry the
// scorer would refuse (more than 4 screenshots or one over 256 KiB; more than 993 files and directories in app/ or
// 16 MiB of app files: app/ counts beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 16777216 }),
);
