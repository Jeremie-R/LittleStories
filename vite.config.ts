import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import pkg from './package.json' with { type: 'json' }

// Emits dist/sw.js from sw.template.js with the list of files to precache, so the
// app shell and icons work offline. No Workbox needed.
function serviceWorker(): Plugin {
  const publicFiles = (dir: string): string[] =>
    readdirSync(dir).flatMap((name) => {
      const path = join(dir, name)
      if (name.startsWith('.')) return []
      return statSync(path).isDirectory() ? publicFiles(path) : [path]
    })

  return {
    name: 'little-stories-sw',
    apply: 'build',
    generateBundle(_options, bundle) {
      // Fonts and the world map (~750 kB, only needed on the Map tab) are cached the first time they're used.
      const fromBundle = Object.keys(bundle).filter(
        (file) => !file.endsWith('.map') && !file.endsWith('.woff2') && !file.endsWith('.json') && file !== 'index.html',
      )
      const fromPublic = publicFiles('public')
        .map((file) => relative('public', file))
        .filter((file) => !file.endsWith('.txt'))
      const precache = ['/', ...[...fromBundle, ...fromPublic].map((file) => '/' + file)]
      const source = readFileSync('sw.template.js', 'utf8')
        .replace('__BUILD_ID__', Date.now().toString(36))
        .replace('__PRECACHE__', JSON.stringify(precache))
      this.emitFile({ type: 'asset', fileName: 'sw.js', source })
    },
  }
}

export default defineConfig({
  plugins: [react(), serviceWorker()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  server: { host: true },
})
