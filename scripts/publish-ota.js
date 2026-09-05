#!/usr/bin/env node
/**
 * Build the app and create a versioned OTA bundle zip in ../ota-server/bundles.
 * The version is auto-generated from package.json + a UTC timestamp so
 * every `npm run ota:publish` produces a NEW version the server can pick up.
 *
 * No arguments needed:
 *   npm run ota:publish
 */
import { execSync } from 'node:child_process';
import { mkdirSync, existsSync, createWriteStream, readFileSync, writeFileSync } from 'node:fs';
import { resolve, join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf-8'));

const pad = (n) => String(n).padStart(2, '0');
const now = new Date();
const stamp =
  `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}` +
  `${pad(now.getUTCHours())}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}`;
const version = `${pkg.version}-${stamp}`;

// Matches capacitor.config.ts -> OTA_SERVER. Only used to print a hint;
// the publisher writes the zip directly to ota-server/bundles/.
const OTA_HOST = process.env.OTA_HOST || '192.168.0.50';
const OTA_PORT = process.env.OTA_PORT || '9000';

console.log(`[bundle] Building OTA bundle version: ${version}`);

// Expose version to Vite / app code as an env var so you can display it in UI.
process.env.APP_VERSION = version;
execSync('npm run build', { stdio: 'inherit', cwd: root, env: { ...process.env } });

const bundlesDir = join(root, 'ota-server', 'bundles');
if (!existsSync(bundlesDir)) mkdirSync(bundlesDir, { recursive: true });

const outFile = join(bundlesDir, `v${version}.zip`);
console.log(`[bundle] Zipping dist/ -> ${outFile}`);

// Prefer `archiver` (v7) when available; otherwise fall back to a platform zip.
let archiver = null;
try {
  archiver = require('archiver'); // CJS callable factory in archiver@7
  if (typeof archiver !== 'function') archiver = null;
} catch {
  /* not installed */
}

if (archiver) {
  await new Promise((res, rej) => {
    const output = createWriteStream(outFile);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', res);
    archive.on('error', rej);
    archive.pipe(output);
    archive.directory(join(root, 'dist'), false);
    archive.finalize();
  });
} else {
  const distDir = join(root, 'dist');
  const isWin = process.platform === 'win32';
  if (isWin) {
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -Path '${distDir}\\*' -DestinationPath '${outFile}' -Force"`,
      { stdio: 'inherit' },
    );
  } else {
    execSync(`cd "${distDir}" && zip -r "${outFile}" .`, { stdio: 'inherit', shell: '/bin/bash' });
  }
}

// Write a small manifest so the server always knows the freshest version.
const manifest = { latest: version, file: `v${version}.zip`, created_at: now.toISOString() };
const manifestPath = join(bundlesDir, 'latest.json');
writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

console.log(`[bundle] ✅ Done. Latest manifest: ${manifestPath}`);
console.log(`[bundle] Serve at:  http://${OTA_HOST}:${OTA_PORT}/bundles/v${version}.zip`);
