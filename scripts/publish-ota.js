#!/usr/bin/env node
/**
 * Build the web app and publish a new OTA bundle to the local OTA server.
 *
 * Usage:
 *   node scripts/publish-ota.js               # auto-bump patch (default)
 *   node scripts/publish-ota.js patch|minor|major
 *   node scripts/publish-ota.js 1.2.3         # publish an explicit version
 *
 * Steps:
 *   1. Resolve the next version (auto-bump package.json OR use the arg)
 *   2. Write the new version back to package.json
 *   3. Run `npm run build` (produces dist/)
 *   4. Zip dist/ -> ota-server/bundles/<version>.zip
 *   5. POST /admin/register to the OTA server so it becomes the "latest"
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// `archiver` is a CommonJS module whose `module.exports` is the factory
// function itself. Under `"type": "module"` Node's ESM loader does NOT expose
// a default export for it (`import archiver from 'archiver'` yields undefined),
// so we bridge via createRequire to get the callable factory.
const require = createRequire(import.meta.url);
const archiver = require('archiver');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const distDir = path.join(repoRoot, 'dist');
const bundlesDir = path.join(repoRoot, 'ota-server', 'bundles');
const pkgPath = path.join(repoRoot, 'package.json');

const OTA_URL = process.env.OTA_URL || 'http://192.168.0.50:9000';

const SEMVER_RE = /^(\d+)\.(\d+)\.(\d+)$/;

function readPkg() {
  return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
}
function writePkg(pkg) {
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
}

function bumpSemver(version, kind) {
  const m = SEMVER_RE.exec(version || '');
  let [maj, min, pat] = m ? [Number(m[1]), Number(m[2]), Number(m[3])] : [0, 0, 0];
  switch (kind) {
    case 'major': maj += 1; min = 0; pat = 0; break;
    case 'minor': min += 1; pat = 0; break;
    case 'patch':
    default:      pat += 1; break;
  }
  return `${maj}.${min}.${pat}`;
}

/**
 * Resolve the next version.
 *
 *  - no arg          → auto-bump patch of package.json.version
 *  - "patch|minor|major" → bump that field of package.json.version
 *  - explicit "x.y.z"    → use as-is
 *
 * Also handles collisions: if the resolved version already has a bundle,
 * keep bumping patch until we find a free one, so publishing twice in a
 * row from a fresh checkout still works.
 */
async function resolveVersion(pkg) {
  const arg = process.argv[2];
  const current = pkg.version || '0.0.0';

  let next;
  if (!arg) {
    next = bumpSemver(current, 'patch');
  } else if (['patch', 'minor', 'major'].includes(arg)) {
    next = bumpSemver(current, arg);
  } else if (SEMVER_RE.test(arg)) {
    next = arg;
  } else {
    // Free-form version string — accept it verbatim.
    next = arg;
  }

  // Guard against collisions with existing bundles on disk.
  while (fs.existsSync(path.join(bundlesDir, `${next}.zip`))) {
    console.log(`  · bundle ${next}.zip already exists, bumping patch`);
    next = bumpSemver(next, 'patch');
  }

  return next;
}

async function main() {
  fs.mkdirSync(bundlesDir, { recursive: true });

  const pkg = readPkg();
  const version = await resolveVersion(pkg);

  console.log(`▶ package.json version: ${pkg.version || '(none)'} → ${version}`);
  pkg.version = version;
  writePkg(pkg);

  console.log('▶ Building web app…');
  execSync('npm run build', { cwd: repoRoot, stdio: 'inherit' });

  const zipPath = path.join(bundlesDir, `${version}.zip`);
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  console.log(`▶ Zipping ${distDir} -> ${zipPath}`);
  await zipDirectory(distDir, zipPath);

  console.log(`▶ Registering with OTA server at ${OTA_URL}`);
  const res = await fetch(`${OTA_URL}/admin/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ version }),
  });
  if (!res.ok) {
    console.error('registration failed:', res.status, await res.text());
    process.exit(1);
  }
  const body = await res.json();
  console.log('✔ Published version', body.version, 'sha256=' + body.checksum.slice(0, 12) + '…');
}

function zipDirectory(sourceDir, outPath) {
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
