import { Capacitor } from '@capacitor/core';
import { CapacitorUpdater, type BundleInfo } from '@capgo/capacitor-updater';

/**
 * OTA update helper.
 *
 * - Notifies the native layer that the JS layer is alive (required so the
 *   plugin doesn't roll back the just-installed bundle).
 * - Polls the OTA server every 15 seconds and installs any newer bundle.
 *
 * The server-side contract lives in `ota-server/server.js`.
 */

const POLL_INTERVAL_MS = 15_000;

let pollTimer: ReturnType<typeof setInterval> | null = null;
let checking = false;

function log(...args: unknown[]) {
  // eslint-disable-next-line no-console
  console.log('[ota]', ...args);
}

/**
 * Ask the plugin to check the configured `autoUpdateUrl` for a newer bundle.
 * If one exists, download → set as next → reload into it.
 */
export async function checkForUpdateNow(): Promise<BundleInfo | null> {
  if (!Capacitor.isPluginAvailable('CapacitorUpdater')) return null;
  if (checking) return null;
  checking = true;
  try {
    const latest = await CapacitorUpdater.getLatest();
    const current = await CapacitorUpdater.current();

    // The server returns `{ version: '...', url: '...' }` or `{ message: 'No new version available' }`.
    if (!latest?.version || !latest?.url) {
      log('no update available', latest);
      return null;
    }
    if (latest.version === current.bundle.version) {
      log('already on latest', latest.version);
      return null;
    }

    log('downloading', latest.version, latest.url);
    const bundle = await CapacitorUpdater.download({
      url: latest.url,
      version: latest.version,
    });

    log('setting bundle', bundle.id, bundle.version);
    await CapacitorUpdater.set({ id: bundle.id });
    // `set()` triggers a reload into the new bundle automatically.
    return bundle;
  } catch (err) {
    log('check failed', err);
    return null;
  } finally {
    checking = false;
  }
}

/**
 * Start the app-lifetime 15-second polling loop.
 * Call once from your app bootstrap.
 */
export function startOtaPolling(intervalMs: number = POLL_INTERVAL_MS): void {
  if (!Capacitor.isNativePlatform()) return;
  if (!Capacitor.isPluginAvailable('CapacitorUpdater')) return;

  // Tell the native layer we booted successfully so it doesn't roll back.
  CapacitorUpdater.notifyAppReady().catch((e) => log('notifyAppReady failed', e));

  // Fire once immediately, then on an interval.
  void checkForUpdateNow();

  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(() => {
    void checkForUpdateNow();
  }, intervalMs);

  log(`polling every ${intervalMs}ms`);
}

export function stopOtaPolling(): void {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}
