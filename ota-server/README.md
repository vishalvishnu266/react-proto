# OTA Server

A tiny local OTA update server compatible with
[`@capgo/capacitor-updater`](https://github.com/Cap-go/capacitor-updater).

## Run

```bash
# From the repo root
npm run ota:server
# or
cd ota-server && node server.js
```

Listens on `0.0.0.0:9000`. The Capacitor app is configured to poll
`http://192.168.0.50:9000/updates` every 15s (see `src/lib/ota.ts`).

## Publish a new bundle

```bash
# From the repo root — builds the web app, zips dist/, drops it into
# ota-server/bundles/<version>.zip, and updates manifest.json.
npm run ota:publish -- 1.0.1
```

The next time a device polls, it will receive:

```json
{
  "version": "1.0.1",
  "url": "http://192.168.0.50:9000/bundles/1.0.1.zip",
  "checksum": "<sha256>"
}
```

## Endpoints

| Method | Path                | Purpose                              |
| ------ | ------------------- | ------------------------------------ |
| POST   | `/updates`          | Update-check (Capgo plugin protocol) |
| POST   | `/stats`            | Telemetry sink (no-op)               |
| POST   | `/channel`          | Channel resolver (no-op)             |
| GET    | `/bundles/*.zip`    | Static download of bundle zips       |
| GET    | `/manifest`         | Current manifest (debug)             |
| GET    | `/health`           | Liveness probe                       |
| POST   | `/admin/register`   | Register a bundle already in `bundles/` (used by `publish.js`) |

## Configuration

Environment variables:

- `OTA_HOST` (default `0.0.0.0`)
- `OTA_PORT` (default `9000`)
- `OTA_PUBLIC_URL` (default `http://192.168.0.50:9000`) — must be reachable from the device.
