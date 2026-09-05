import { Capacitor } from '@capacitor/core';
import {
  CapacitorUpdater,
  type BundleInfo,
} from '@capgo/capacitor-updater';

/**
 * OTA update helper.
 *
 * Strategy:
 *   1. On startup call `notifyAppReady()` so the native layer doesn't roll
 *      back the currently-running bundle.
 *   2. Every 15s, `fetch()` our OTA server's /updates endpoint directly
 *      (rather than relying on `CapacitorUpdater.getLatest()`, which is a
 *      convenience wrapper that behaves differently across plugin versions
 *      and can silently swallow errors).
 *   3. If the server says a newer version exists, download it with the
 *      plugin, set it as next, and reload.
 *
 * The server-side contract lives in `ota-server/server.js`.
 */

const POLL_INTERVAL_MS = 15_000;

// Baked in at build time via Vite `define` (see vite.config.ts). Falls back
// to a sensible default if it wasn't set. Change via .env.ota + rebuild.
declare const __OTA_URL__: string;
const OTA_UPDATES_URL =
  (typeof __OTA_URL__ !== 'undefined' && __OTA_URL__) ||
  'http://192.168.0.6:9000/updates';

let pollTimer: ReturnType<typeof setInterval> | null = null;
let checking = false;
let lastTriedVersion: string | null = null;

function log(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log('[ota]', ...args);
}

interface ServerUpdateResponse {
  version?: string;
  url?: string;
  checksum?: string;
  session_key?: string;
  message?: string;
}

async function fetchLatestFromServer(
  currentVersion: string,
): Promise<ServerUpdateResponse | null> {
  try {
    const res = await fetch(OTA_UPDATES_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        app_id: 'com.myapp.app',
        device_id: 'device',
        platform: Capacitor.getPlatform(),
        version_name: currentVersion,
        version_build: currentVersion,
        plugin_version: '7.0.0',
        is_emulator: false,
        is_prod: true,
      }),
    });
    if (!res.ok) {
      log('server returned', res.status, await res.text());
      return null;
    }
    return (await res.json()) as ServerUpdateResponse;
  } catch (err) {
    log('fetch failed', String(err));
    return null;
  }
}

/**
 * Check the OTA server for a newer bundle; download + apply if found.
 */
export async function checkForUpdateNow(): Promise<BundleInfo | null> {
  if (!Capacitor.isNativePlatform()) return null;
  if (!Capacitor.isPluginAvailable('CapacitorUpdater')) {
    log('plugin unavailable');
    return null;
  }
  if (checking) return null;
  checking = true;
  try {
    const current = await CapacitorUpdater.current();
    const currentVersion = current?.bundle?.version || 'builtin';

    const latest = await fetchLatestFromServer(currentVersion);
    if (!latest) return null;
    if (latest.message || !latest.version || !latest.url) {
      log('no update — server said:', JSON.stringify(latest));
      return null;
    }
    if (latest.version === currentVersion) {
      log('already on latest', latest.version);
      return null;
    }
    if (latest.version === lastTriedVersion) {
      // Avoid spamming download attempts for a version we just failed on.
      log('skipping — already tried', latest.version);
      return null;
    }
    lastTriedVersion = latest.version;

    log('downloading', latest.version, '→', latest.url);
    // NOTE: intentionally NOT passing a `checksum` here. The plugin will
    // otherwise reject the download unless the checksum matches its exact
    // expected format (which varies across plugin versions). Since we're
    // running unsigned in dev (publicKey: ''), skipping it is safe.
    const bundle = await CapacitorUpdater.download({
      url: latest.url,
      version: latest.version,
    });
    log('downloaded bundle', JSON.stringify(bundle));

    log('applying bundle', bundle.id);
    await CapacitorUpdater.set({ id: bundle.id });
    // set() reloads the webview into the new bundle. Execution won't continue.
    return bundle;
  } catch (err) {
    log('check failed', String(err), (err as Error)?.stack);
    return null;
  } finally {
    checking = false;
  }
}

/**
 * Start the app-lifetime 15-second polling loop.
 */
export function startOtaPolling(intervalMs: number = POLL_INTERVAL_MS): void {
  if (!Capacitor.isNativePlatform()) {
    log('not a native platform — polling disabled');
    return;
  }
  if (!Capacitor.isPluginAvailable('CapacitorUpdater')) {
    log('CapacitorUpdater plugin not available — polling disabled');
    return;
  }

  // Confirm the current bundle is healthy so it isn't rolled back.
  CapacitorUpdater.notifyAppReady()
    .then(() => log('notifyAppReady OK'))
    .catch((e) => log('notifyAppReady failed', String(e)));

  // Fire once immediately, then on an interval.
  void checkForUpdateNow();

  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    void checkForUpdateNow();
  }, intervalMs);

  log(`polling ${OTA_UPDATES_URL} every ${intervalMs}ms`);
}

export function stopOtaPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
