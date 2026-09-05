#!/usr/bin/env node
/**
 * Build the web app and publish a new OTA bundle to the local OTA server.
 *
 * Usage:
 *   node scripts/publish-ota.js <version>
 *
 * Steps:
 *   1. Run `npm run build` (produces dist/)
 *   2. Zip dist/ -> ota-server/bundles/<version>.zip
 *   3. POST /admin/register to the OTA server so it becomes the "latest"
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

const OTA_URL = process.env.OTA_URL || 'http://192.168.0.50:9000';

async function main() {
  const version = process.argv[2];
  if (!version) {
    console.error('usage: node scripts/publish-ota.js <version>');
    process.exit(1);
  }

  console.log('▶ Building web app…');
  execSync('npm run build', { cwd: repoRoot, stdio: 'inherit' });

  fs.mkdirSync(bundlesDir, { recursive: true });
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
