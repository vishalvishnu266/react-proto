import type { CapacitorConfig } from '@capacitor/cli';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * OTA server base URL. The device MUST be able to reach this IP:port.
 * Configured centrally via `.env.ota` (OTA_HOST + OTA_PORT) so we don't
 * have to keep it in sync across capacitor.config.ts, ota-server/server.js
 * and src/lib/ota.ts by hand.
 *
 * Capacitor's CLI loads this file with a CommonJS loader (ts-node/register),
 * so we can't use `import.meta.url` here — use __dirname + fs instead.
 */
function loadOtaEnv() {
  const defaults: Record<string, string> = {
    OTA_HOST: '192.168.0.6',
    OTA_PORT: '9000',
  };
  const envPath = path.join(__dirname, '.env.ota');
  if (fs.existsSync(envPath)) {
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#')) continue;
      const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line);
      if (m) defaults[m[1]] = m[2];
    }
  }
  if (process.env.OTA_HOST) defaults.OTA_HOST = process.env.OTA_HOST;
  if (process.env.OTA_PORT) defaults.OTA_PORT = process.env.OTA_PORT;
  return defaults;
}
const { OTA_HOST, OTA_PORT } = loadOtaEnv();
const OTA_SERVER = `http://${OTA_HOST}:${OTA_PORT}`;

const config: CapacitorConfig = {
  appId: 'com.myapp.app',
  appName: 'my-app',
  webDir: 'dist',
  // Allow http:// scheme instead of the default https:// for the webview origin,
  // which is required when the app talks to local-network / plain-HTTP services.
  android: {
    allowMixedContent: true,
  },
  server: {
    // Use http so requests to plain-HTTP endpoints on the local network are not
    // upgraded/blocked. In dev, you can override `url` to point at a machine on
    // your LAN (e.g. http://192.168.1.10:5173) via the CAP_SERVER_URL env var.
    androidScheme: 'http',
    cleartext: true,
    ...(process.env.CAP_SERVER_URL
      ? { url: process.env.CAP_SERVER_URL }
      : {}),
  },
  plugins: {
    // @capawesome/capacitor-live-update — self-hosted friendly.
    // We drive the whole flow from src/lib/ota.ts (poll → downloadBundle →
    // setNextBundle → reload), so no per-plugin URL config is needed.
    // `readyTimeout` = how long the plugin waits for `LiveUpdate.ready()`
    // to be called after boot before rolling back to the previous bundle.
    LiveUpdate: {
      appId: 'com.myapp.app',
      autoDeleteBundles: true,
      readyTimeout: 10000,
      // OTA server base URL kept here for reference / debugging only.
      // The actual URL used by the client lives in src/lib/ota.ts.
      // serverUrl: `${OTA_SERVER}`,
    },
  },
};

export default config;
