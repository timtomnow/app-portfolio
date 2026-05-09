import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const ROOT = path.dirname(fileURLToPath(import.meta.url))

function readBody(req: import('http').IncomingMessage): Promise<string> {
  return new Promise(resolve => {
    let raw = ''
    req.on('data', chunk => { raw += String(chunk) })
    req.on('end', () => resolve(raw))
  })
}

function adminApiPlugin(): Plugin {
  return {
    name: 'admin-api',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/admin/save', async (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        res.setHeader('Content-Type', 'application/json')
        try {
          const { app, files } = JSON.parse(await readBody(req)) as {
            app: Record<string, unknown>
            files: {
              icon?: { data: string; ext: string }
              screenshots?: { data: string; name: string }[]
              demoVideo?: { data: string }
            }
          }
          const slug = app.slug as string
          const appsPath = path.join(ROOT, 'src/data/apps.json')
          const data = JSON.parse(fs.readFileSync(appsPath, 'utf-8')) as { apps: Record<string, unknown>[] }
          const idx = data.apps.findIndex(a => a.slug === slug)
          if (idx >= 0) data.apps[idx] = app
          else data.apps.push(app)
          fs.writeFileSync(appsPath, JSON.stringify(data, null, 2) + '\n')

          const assetRoot = path.join(ROOT, 'public/assets', slug)
          fs.mkdirSync(path.join(assetRoot, 'screenshots'), { recursive: true })
          if (files.icon) {
            fs.writeFileSync(
              path.join(assetRoot, `icon.${files.icon.ext}`),
              Buffer.from(files.icon.data, 'base64'),
            )
          }
          for (const shot of files.screenshots ?? []) {
            fs.writeFileSync(
              path.join(assetRoot, 'screenshots', shot.name),
              Buffer.from(shot.data, 'base64'),
            )
          }
          if (files.demoVideo) {
            fs.writeFileSync(
              path.join(assetRoot, 'demo.mp4'),
              Buffer.from(files.demoVideo.data, 'base64'),
            )
          }
          res.end(JSON.stringify({ ok: true }))
        } catch (e) {
          res.statusCode = 500
          res.end(JSON.stringify({ ok: false, error: String(e) }))
        }
      })

      server.middlewares.use('/api/admin/delete', async (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        res.setHeader('Content-Type', 'application/json')
        try {
          const { slug } = JSON.parse(await readBody(req)) as { slug: string }
          const appsPath = path.join(ROOT, 'src/data/apps.json')
          const data = JSON.parse(fs.readFileSync(appsPath, 'utf-8')) as { apps: { slug: string }[] }
          data.apps = data.apps.filter(a => a.slug !== slug)
          fs.writeFileSync(appsPath, JSON.stringify(data, null, 2) + '\n')
          res.end(JSON.stringify({ ok: true }))
        } catch (e) {
          res.statusCode = 500
          res.end(JSON.stringify({ ok: false, error: String(e) }))
        }
      })

      server.middlewares.use('/api/admin/save-sections', async (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        res.setHeader('Content-Type', 'application/json')
        try {
          const { sections, deletedId } = JSON.parse(await readBody(req)) as {
            sections: { id: string; label: string; order: number }[]
            deletedId?: string
          }
          const appsPath = path.join(ROOT, 'src/data/apps.json')
          const data = JSON.parse(fs.readFileSync(appsPath, 'utf-8')) as {
            apps: ({ slug: string; sectionId?: string } & Record<string, unknown>)[]
            sections: unknown[]
          }
          data.sections = sections
          if (deletedId) {
            data.apps = data.apps.map(a => {
              if (a.sectionId !== deletedId) return a
              return Object.fromEntries(Object.entries(a).filter(([k]) => k !== 'sectionId')) as typeof a
            })
          }
          fs.writeFileSync(appsPath, JSON.stringify(data, null, 2) + '\n')
          res.end(JSON.stringify({ ok: true }))
        } catch (e) {
          res.statusCode = 500
          res.end(JSON.stringify({ ok: false, error: String(e) }))
        }
      })

      server.middlewares.use('/api/admin/gen-assets', async (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return }
        res.setHeader('Content-Type', 'application/json')
        try {
          const { slug } = JSON.parse(await readBody(req)) as { slug: string }
          const configPath = path.join(ROOT, 'tools/asset-gen/configs', `${slug}.json`)
          if (!fs.existsSync(configPath)) {
            res.statusCode = 404
            res.end(JSON.stringify({ ok: false, error: `No config found at tools/asset-gen/configs/${slug}.json` }))
            return
          }
          await new Promise<void>((resolve, reject) => {
            const proc = spawn('npx', ['tsx', 'tools/asset-gen/index.ts', '--config', configPath], {
              cwd: ROOT,
              stdio: 'pipe',
            })
            let errOut = ''
            proc.stderr?.on('data', d => { errOut += String(d) })
            proc.on('close', code => (code === 0 ? resolve() : reject(new Error(errOut || `exit ${code}`))))
            proc.on('error', reject)
          })
          res.end(JSON.stringify({ ok: true }))
        } catch (e) {
          res.statusCode = 500
          res.end(JSON.stringify({ ok: false, error: String(e) }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), adminApiPlugin()],
  base: '/app-portfolio/',
})
