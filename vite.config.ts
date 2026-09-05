import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

// Load .env.ota (OTA_HOST / OTA_PORT) so we can bake the OTA URL into the
// client bundle without hard-coding it in TS.
function loadOtaEnv() {
  const out: Record<string, string> = { OTA_HOST: '192.168.0.6', OTA_PORT: '9000' }
  const p = resolve(__dirname, '.env.ota')
  if (existsSync(p)) {
    for (const line of readFileSync(p, 'utf8').split(/\r?\n/)) {
      if (!line || line.trim().startsWith('#')) continue
      const m = /^\s*([A-Z_][A-Z0-9_]*)\s*=\s*(.*?)\s*$/.exec(line)
      if (m) out[m[1]] = m[2]
    }
  }
  if (process.env.OTA_HOST) out.OTA_HOST = process.env.OTA_HOST
  if (process.env.OTA_PORT) out.OTA_PORT = process.env.OTA_PORT
  return out
}
const { OTA_HOST, OTA_PORT } = loadOtaEnv()
const OTA_URL = `http://${OTA_HOST}:${OTA_PORT}/updates`

export default defineConfig({
  plugins: [TanStackRouterVite(), react(), tailwindcss()],
  define: {
    __OTA_URL__: JSON.stringify(OTA_URL),
  },
})