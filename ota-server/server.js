/**
 * OTA update server for the Capacitor app.
 *
 * Protocol is compatible with @capgo/capacitor-updater's `autoUpdateUrl`:
 *
 *   POST /updates
 *     body: { app_id, device_id, version_name, version_build, plugin_version, ... }
 *     200:  { version, url, session_key?, checksum? }        // update available
 *     200:  { message: "No new version available" }          // up to date
 *
 * The server serves bundle zips from ./bundles/<version>.zip and keeps track
 * of the "latest" version in ./bundles/manifest.json:
 *
 *   { "latest": "1.0.1", "versions": { "1.0.1": { "checksum": "..." } } }
 *
 * The `publish.js` script builds the web app and drops a new zip + updates
 * this manifest.
 */

import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUNDLES_DIR = path.join(__dirname, 'bundles');
const MANIFEST_PATH = path.join(BUNDLES_DIR, 'manifest.json');

const HOST = process.env.OTA_HOST || '0.0.0.0';
const PORT = Number(process.env.OTA_PORT || 9000);
// Publicly reachable base URL that the device will use to download the zip.
// Must match capacitor.config.ts -> OTA_SERVER.
const PUBLIC_BASE_URL = process.env.OTA_PUBLIC_URL || 'http://192.168.0.50:9000';

fs.mkdirSync(BUNDLES_DIR, { recursive: true });
if (!fs.existsSync(MANIFEST_PATH)) {
  fs.writeFileSync(
    MANIFEST_PATH,
    JSON.stringify({ latest: null, versions: {} }, null, 2),
  );
}

function readManifest() {
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
}

function log(...args) {
  const ts = new Date().toISOString();
  // eslint-disable-next-line no-console
  console.log(`[ota ${ts}]`, ...args);
}

const app = express();
app.use(express.json({ limit: '2mb' }));

// Simple request logger.
app.use((req, _res, next) => {
  log(req.method, req.url, req.ip);
  next();
});

// --- Update check endpoint ---------------------------------------------------
app.post('/updates', (req, res) => {
  const manifest = readManifest();
  const latest = manifest.latest;
  const client = req.body || {};
  const clientVersion = client.version_name || client.version_build || 'unknown';

  if (!latest) {
    return res.json({ message: 'No new version available' });
  }
  if (clientVersion === latest) {
    return res.json({ message: 'No new version available' });
  }

  const entry = manifest.versions[latest];
  if (!entry) {
    return res.json({ message: 'No new version available' });
  }

  const payload = {
    version: latest,
    url: `${PUBLIC_BASE_URL}/bundles/${encodeURIComponent(latest)}.zip`,
    checksum: entry.checksum,
    session_key: '',
  };
  log('offering', clientVersion, '->', latest);
  return res.json(payload);
});

// --- Optional telemetry endpoints (no-op 200) --------------------------------
app.post('/stats', (_req, res) => res.status(200).json({ ok: true }));
app.post('/channel', (_req, res) => res.status(200).json({ ok: true }));

// --- Static hosting for bundle zips ------------------------------------------
app.use(
  '/bundles',
  express.static(BUNDLES_DIR, {
    fallthrough: false,
    setHeaders(res) {
      res.setHeader('Cache-Control', 'no-store');
    },
  }),
);

// --- Admin: list what we're serving ------------------------------------------
app.get('/manifest', (_req, res) => res.json(readManifest()));
app.get('/health', (_req, res) => res.json({ ok: true }));

// --- Admin: register a new bundle after it has been dropped in ./bundles -----
// Used by scripts/publish.js. Body: { version }
app.post('/admin/register', (req, res) => {
  const { version } = req.body || {};
  if (!version) return res.status(400).json({ error: 'version required' });

  const zipPath = path.join(BUNDLES_DIR, `${version}.zip`);
  if (!fs.existsSync(zipPath)) {
    return res.status(404).json({ error: `bundles/${version}.zip missing` });
  }

  const buf = fs.readFileSync(zipPath);
  const checksum = crypto.createHash('sha256').update(buf).digest('hex');

  const manifest = readManifest();
  manifest.versions[version] = { checksum, size: buf.length, publishedAt: new Date().toISOString() };
  manifest.latest = version;
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

  log('registered version', version, 'sha256=' + checksum.slice(0, 12) + '...');
  res.json({ ok: true, version, checksum });
});

// --- Admin: upload + register in one shot -----------------------------------
// Used by scripts/publish-ota.js when the publisher and the server run on
// different machines. Streams the zip body to bundles/<version>.zip, then
// updates the manifest so it becomes the "latest" version.
//
//   POST /admin/upload?version=1.2.3
//   Content-Type: application/zip
//   <raw zip bytes as body>
app.post(
  '/admin/upload',
  express.raw({ type: '*/*', limit: '500mb' }),
  (req, res) => {
    const version = String(req.query.version || '').trim();
    if (!version) return res.status(400).json({ error: 'version query param required' });
    if (!req.body || !req.body.length) return res.status(400).json({ error: 'empty body' });

    const zipPath = path.join(BUNDLES_DIR, `${version}.zip`);
    fs.writeFileSync(zipPath, req.body);
    const checksum = crypto.createHash('sha256').update(req.body).digest('hex');

    const manifest = readManifest();
    manifest.versions[version] = {
      checksum,
      size: req.body.length,
      publishedAt: new Date().toISOString(),
    };
    manifest.latest = version;
    fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));

    log('uploaded + registered version', version, 'sha256=' + checksum.slice(0, 12) + '...');
    res.json({ ok: true, version, checksum, size: req.body.length });
  },
);

app.listen(PORT, HOST, () => {
  log(`OTA server listening on http://${HOST}:${PORT}`);
  log(`Public base URL: ${PUBLIC_BASE_URL}`);
  log(`Bundles dir: ${BUNDLES_DIR}`);
});
