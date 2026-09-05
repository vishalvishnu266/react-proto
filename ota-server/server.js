/**
 * Minimal OTA update server.
 *
 * Reads ota-server/bundles/latest.json (written by scripts/publish-ota.js) to
 * find the newest bundle, and serves the zips from ota-server/bundles/.
 *
 *   POST /updates             -> { version, url, checksum } or { message: "No new version available" }
 *   GET  /bundles/<file>.zip  -> the zipped web build
 *   GET  /health              -> { ok: true }
 *   GET  /latest              -> raw contents of latest.json (debug)
 */

import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BUNDLES_DIR = path.join(__dirname, 'bundles');
const LATEST_PATH = path.join(BUNDLES_DIR, 'latest.json');

// Load .env.ota so this server + the app + the publisher all agree on the URL.
function loadEnvFile(p) {
  if (!fs.existsSync(p)) return;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (!line || line.trim().startsWith('#')) continue;
    const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2];
  }
}
loadEnvFile(path.join(__dirname, '..', '.env.ota'));

const HOST = process.env.OTA_HOST_BIND || '0.0.0.0';
const PORT = Number(process.env.OTA_PORT || 9000);
// The URL the device uses to download bundle zips.
const PUBLIC_BASE_URL =
  process.env.OTA_PUBLIC_URL ||
  `http://${process.env.OTA_HOST || '192.168.0.6'}:${PORT}`;

fs.mkdirSync(BUNDLES_DIR, { recursive: true });

function log(...args) {
  const ts = new Date().toISOString();
  // eslint-disable-next-line no-console
  console.log(`[ota ${ts}]`, ...args);
}

function readLatest() {
  if (!fs.existsSync(LATEST_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(LATEST_PATH, 'utf8'));
  } catch (e) {
    log('failed to read latest.json:', e.message);
    return null;
  }
}

function sha256File(p) {
  const buf = fs.readFileSync(p);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

const app = express();
app.use(express.json({ limit: '2mb' }));

app.use((req, _res, next) => {
  log(req.method, req.url);
  next();
});

// --- Update check (Capgo Updater protocol) ----------------------------------
// Capgo sends a rich payload; we only care about the version identifier.
// For a freshly-installed APK the built-in bundle reports version "builtin",
// so anything that isn't literally the current latest counts as "outdated".
app.post('/updates', (req, res) => {
  const latest = readLatest();
  const client = req.body || {};
  const clientVersion =
    client.version_name || client.version_build || client.version || 'unknown';

  // Verbose logging so we can see exactly what the device asks for.
  log(
    'update check from',
    clientVersion,
    'platform=' + (client.platform || '?'),
    'app_id=' + (client.app_id || '?'),
  );

  if (!latest || !latest.latest || !latest.file) {
    log('  -> no bundle published yet');
    return res.json({ message: 'No new version available' });
  }

  const zipPath = path.join(BUNDLES_DIR, latest.file);
  if (!fs.existsSync(zipPath)) {
    log('  -> latest.json points to missing file:', latest.file);
    return res.json({ message: 'No new version available' });
  }

  if (clientVersion === latest.latest) {
    log('  -> client already on latest', latest.latest);
    return res.json({ message: 'No new version available' });
  }

  const payload = {
    version: latest.latest,
    url: `${PUBLIC_BASE_URL}/bundles/${encodeURIComponent(latest.file)}`,
    checksum: sha256File(zipPath),
    session_key: '',
  };
  log('  -> offering', latest.latest, payload.url);
  res.json(payload);
});

// --- Optional telemetry endpoints (no-op 200) --------------------------------
app.post('/stats', (_req, res) => res.status(200).json({ ok: true }));
app.post('/channel', (_req, res) => res.status(200).json({ ok: true }));

// --- Static hosting for bundle zips ------------------------------------------
app.use(
  '/bundles',
  express.static(BUNDLES_DIR, {
    setHeaders(res) {
      res.setHeader('Cache-Control', 'no-store');
    },
  }),
);

app.get('/latest', (_req, res) => {
  const latest = readLatest();
  if (!latest) return res.status(404).json({ error: 'no bundle published yet' });
  res.json(latest);
});
app.get('/health', (_req, res) => res.json({ ok: true }));

app.listen(PORT, HOST, () => {
  log(`OTA server listening on http://${HOST}:${PORT}`);
  log(`Public base URL: ${PUBLIC_BASE_URL}`);
  log(`Bundles dir: ${BUNDLES_DIR}`);
});
