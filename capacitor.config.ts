import type { CapacitorConfig } from '@capacitor/cli';

/**
 * OTA server base URL. Update this if the LAN OTA server moves.
 * The Node.js OTA server in `ota-server/` listens on this address:port.
 */
const OTA_SERVER = 'http://192.168.0.50:9000';

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
    CapacitorUpdater: {
      // The plugin will POST device/app info here and expect a JSON response
      // describing the newest bundle. See `ota-server/server.js` -> POST /updates.
      autoUpdateUrl: `${OTA_SERVER}/updates`,
      // We drive checks ourselves every 15s (see src/lib/ota.ts), but leaving
      // autoUpdate on gives us free background download + apply on next resume.
      autoUpdate: true,
      // Statistics/telemetry endpoints (optional; server implements no-op 200s).
      statsUrl: `${OTA_SERVER}/stats`,
      channelUrl: `${OTA_SERVER}/channel`,
      // Public key for signed bundles — left empty to disable signature checks
      // for local development. Populate in production!
      publicKey: '',
      // Directly install without waiting for the app to be backgrounded.
      directUpdate: true,
      // Reset to bundled version if the new one crashes on boot.
      resetWhenUpdate: true,
    },
  },
};

export default config;
