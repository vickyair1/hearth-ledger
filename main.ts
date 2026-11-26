/* HearthLedger entrypoint — hands the entry in for the make.fun checker.
   Copies app/ and screenshots/ into ./output and writes dossier.json.
   Written fresh for this entry; deliberately deterministic: the dossier
   carries no timestamps and no random values, so two runs produce a
   byte-identical dossier.json. Run with: node main.ts */

import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(fileURLToPath(import.meta.url));
/* The grader runs `node /bot/main.ts` with the repo mounted READ-ONLY at
   /bot and an empty writable directory at $MAKEFUN_OUTPUT_DIR (/output).
   Writing the dossier under the repo (./output) fails there with EACCES
   (run_completes, exit 1) even though it works on a writable checkout,
   so honour the grader's output directory when it is set. */
const OUT = process.env.MAKEFUN_OUTPUT_DIR
  ? resolve(process.env.MAKEFUN_OUTPUT_DIR)
  : resolve(ROOT, "output");
const COMPETITION = "best-household-budget-site-20261126-1457";

/* My own guard, added while re-authoring: never hand in an entry whose
   screenshots are missing or stale — a screenshot older than its page
   means the dossier shows work the current code cannot reproduce. */
function assertFreshShots(): void {
  const shots = JSON.parse(readFileSync(join(ROOT, "shots.json"), "utf8")).shots as Array<{ file: string }>;
  for (const s of shots) {
    const shotPath = join(ROOT, s.file);
    if (!existsSync(shotPath)) throw new Error("missing screenshot: " + s.file);
    const shotTime = statSync(shotPath).mtimeMs;
    for (const page of ["app/index.html", "app/app.js", "app/data.js", "app/style.css"]) {
      if (statSync(join(ROOT, page)).mtimeMs > shotTime) {
        throw new Error("stale screenshot " + s.file + " — retake it after editing " + page);
      }
    }
  }
}

function sha256(buf: Buffer): string {
  return createHash("sha256").update(buf).digest("hex");
}

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) out.push(...listFiles(p));
    else if (st.isFile()) out.push(p);
  }
  return out;
}

function copyTree(srcDir: string, destDir: string, files: Array<{ path: string; sha256: string; size: number }>): void {
  mkdirSync(destDir, { recursive: true });
  for (const abs of listFiles(srcDir)) {
    const rel = relative(ROOT, abs);
    const dest = join(destDir, relative(srcDir, abs));
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(abs, dest);
    const buf = readFileSync(abs);
    files.push({ path: rel, sha256: sha256(buf), size: buf.length });
  }
}

function main(): void {
  assertFreshShots();
  const files: Array<{ path: string; sha256: string; size: number }> = [];
  copyTree(join(ROOT, "app"), join(OUT, "app"), files);

  const shots = JSON.parse(readFileSync(join(ROOT, "shots.json"), "utf8")).shots as Array<{
    file: string; name: string; route: string; width: number; height: number;
  }>;
  const shotEntries = shots.map((s) => {
    const abs = join(ROOT, s.file);
    const buf = readFileSync(abs);
    const dest = join(OUT, s.file);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(abs, dest);
    files.push({ path: s.file, sha256: sha256(buf), size: buf.length });
    return {
      name: s.name, file: s.file, route: s.route,
      width: s.width, height: s.height,
      sha256: sha256(buf), size: buf.length,
      dataBase64: buf.toString("base64"),
    };
  });

  const dossier = {
    competition: COMPETITION,
    entry: "hearth-ledger",
    title: "HearthLedger — The Hartono Family Budget",
    entrypoint: "main.ts",
    files: files.sort((a, b) => (a.path < b.path ? -1 : 1)),
    screenshots: shotEntries,
  };
  writeFileSync(join(OUT, "dossier.json"), JSON.stringify(dossier, null, 2) + "\n", "utf8");
  console.log("wrote " + join(OUT, "dossier.json") + " (" + files.length + " files, " + shotEntries.length + " screenshots)");
}

main();
