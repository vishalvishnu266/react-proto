import { Capacitor } from '@capacitor/core';
import { LiveUpdate } from '@capawesome/capacitor-live-update';

/**
 * OTA update helper using @capawesome/capacitor-live-update.
 *
 * We poll our own /updates endpoint every 15 seconds. If it reports a newer
 * bundle we:
 *
 *   1. downloadBundle({ url, bundleId })   -> fetches + unpacks the zip
 *   2. setNextBundle({ bundleId })         -> mark it for the next launch
 *   3. reload()                            -> restart the webview into it
 *
 * `ready()` must be called once on boot so a just-installed bundle isn't
 * rolled back by the plugin's watchdog.
 *
 * The server-side contract lives in `ota-server/server.js`.
 */

const POLL_INTERVAL_MS = 15_000;

// Baked in at build time via Vite `define` (see vite.config.ts). Falls back
// to a sensible default if it wasn't set. Change via .env.ota + rebuild.
declare const __OTA_URL__: string;
const OTA_UPDATES_URL =
  (typeof __OTA_URL__ !== 'undefined' && __OTA_URL__) ||
  'http://192.168.0.50:9000/updates';

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
        platform: Capacitor.getPlatform(),
        version_name: currentVersion,
        version_build: currentVersion,
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
 * Best-effort read of the currently-running bundle's id.
 * On a freshly installed APK this returns something like `null` / "builtin".
 */
async function getCurrentBundleId(): Promise<string> {
  try {
    const result = await LiveUpdate.getCurrentBundle();
    // { bundleId: string | null } — null means the built-in bundle.
    return result?.bundleId || 'builtin';
  } catch (e) {
    log('getCurrentBundle() failed (ok on first launch):', String(e));
    return 'builtin';
  }
}

/**
 * Check the OTA server for a newer bundle; download + apply if found.
 */
export async function checkForUpdateNow(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;
  if (checking) return false;
  checking = true;
  try {
    const currentVersion = await getCurrentBundleId();
    const latest = await fetchLatestFromServer(currentVersion);
    if (!latest) return false;
    if (latest.message || !latest.version || !latest.url) {
      log('no update — server said:', JSON.stringify(latest));
      return false;
    }
    if (latest.version === currentVersion) {
      log('already on latest', latest.version);
      return false;
    }
    if (latest.version === lastTriedVersion) {
      log('skipping — already tried', latest.version);
      return false;
    }
    lastTriedVersion = latest.version;

    log('downloading', latest.version, '→', latest.url);
    await LiveUpdate.downloadBundle({
      bundleId: latest.version,
      url: latest.url,
    });
    log('downloaded bundle', latest.version);

    log('setting next bundle', latest.version);
    await LiveUpdate.setNextBundle({ bundleId: latest.version });

    log('reloading into new bundle');
    await LiveUpdate.reload();
    return true;
  } catch (err) {
    log('check failed', String(err), (err as Error)?.stack);
    return false;
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

  // Tell the plugin the current bundle booted successfully so it isn't
  // rolled back on next launch.
  LiveUpdate.ready()
    .then(() => log('ready() OK'))
    .catch((e) => log('ready() failed', String(e)));

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
