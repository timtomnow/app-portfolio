import { chromium, devices } from 'playwright'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'
import os from 'node:os'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

type Action = string | null

type GenConfig = {
  slug: string
  url: string
  device: 'desktop' | 'mobile'
  screenshots: { name: string; action?: Action }[]
  video?: { durationSec: number; script: string[] }
}

async function runAction(page: import('playwright').Page, action: Action) {
  if (!action) return
  const [type, ...rest] = action.split(':')
  if (type === 'click') {
    await page.click(rest.join(':'))
  } else if (type === 'wait') {
    await page.waitForTimeout(Number(rest[0]))
  } else if (type === 'fill') {
    const [selector, ...valueParts] = rest
    await page.fill(selector, valueParts.join(':'))
  } else if (type === 'scroll') {
    await page.evaluate((y: number) => window.scrollTo({ top: y, behavior: 'smooth' }), Number(rest[0]))
    await page.waitForTimeout(400)
  }
}

function contextOptions(device: 'desktop' | 'mobile') {
  if (device === 'mobile') {
    return devices['iPhone 14']
  }
  return { viewport: { width: 1280, height: 800 } }
}

async function run() {
  const configArg = process.argv.indexOf('--config')
  if (configArg === -1 || !process.argv[configArg + 1]) {
    console.error('Usage: gen:assets --config <path-to-config.json>')
    process.exit(1)
  }

  const configPath = path.resolve(process.argv[configArg + 1])
  const config: GenConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'))
  const { slug, url, device, screenshots, video } = config

  const assetRoot = path.join(ROOT, 'public/assets', slug)
  const shotsDir = path.join(assetRoot, 'screenshots')
  fs.mkdirSync(shotsDir, { recursive: true })

  const browser = await chromium.launch()

  // --- Screenshots ---
  if (screenshots.length > 0) {
    console.log(`Capturing ${screenshots.length} screenshot(s)…`)
    const ctx = await browser.newContext(contextOptions(device))
    const page = await ctx.newPage()
    await page.goto(url, { waitUntil: 'networkidle' })

    for (let i = 0; i < screenshots.length; i++) {
      const { name, action } = screenshots[i]
      await runAction(page, action ?? null)
      const filename = `${name}.png`
      await page.screenshot({ path: path.join(shotsDir, filename), fullPage: false })
      console.log(`  saved screenshots/${filename}`)
    }

    // Capture icon from first screenshot: a square crop via a tiny viewport context
    const iconCtx = await browser.newContext({ viewport: { width: 512, height: 512 } })
    const iconPage = await iconCtx.newPage()
    await iconPage.goto(url, { waitUntil: 'networkidle' })
    await iconPage.screenshot({ path: path.join(assetRoot, 'icon.png') })
    console.log('  saved icon.png')
    await iconCtx.close()

    await ctx.close()
  }

  // --- Demo video ---
  if (video) {
    console.log('Recording demo video…')
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'asset-gen-'))
    const ctx = await browser.newContext({
      ...contextOptions(device),
      recordVideo: { dir: tmpDir, size: device === 'mobile' ? { width: 390, height: 844 } : { width: 1280, height: 800 } },
    })
    const page = await ctx.newPage()
    await page.goto(url, { waitUntil: 'networkidle' })

    const capMs = Math.min(video.durationSec, 60) * 1000
    const scriptStart = Date.now()

    for (const step of video.script) {
      if (Date.now() - scriptStart >= capMs) break
      await runAction(page, step)
    }

    const elapsed = Date.now() - scriptStart
    if (elapsed < capMs) {
      await page.waitForTimeout(capMs - elapsed)
    }

    const videoFile = await page.video()
    await ctx.close()

    if (videoFile) {
      const webmPath = await videoFile.path()
      const mp4Path = path.join(assetRoot, 'demo.mp4')

      try {
        execFileSync('ffmpeg', [
          '-y', '-i', webmPath,
          '-c:v', 'libx264', '-preset', 'fast', '-crf', '23',
          '-c:a', 'aac', '-movflags', '+faststart',
          mp4Path,
        ], { stdio: 'pipe' })
        fs.rmSync(webmPath, { force: true })
        console.log('  saved demo.mp4')
      } catch {
        const webmDest = path.join(assetRoot, 'demo.webm')
        fs.copyFileSync(webmPath, webmDest)
        fs.rmSync(webmPath, { force: true })
        console.log('  ffmpeg not found — saved demo.webm (install ffmpeg to convert to .mp4)')
      }
    }

    fs.rmSync(tmpDir, { recursive: true, force: true })
  }

  await browser.close()

  // Update apps.json entry device fields if entry exists
  const appsPath = path.join(ROOT, 'src/data/apps.json')
  const appsData = JSON.parse(fs.readFileSync(appsPath, 'utf-8')) as {
    apps: {
      slug: string
      screenshots?: { path: string; caption?: string; device: string }[]
      demoVideo?: { path: string; device: string }
    }[]
  }
  const entry = appsData.apps.find(a => a.slug === slug)
  if (entry) {
    const base = `/assets/${slug}`
    entry.screenshots = screenshots.map(s => ({
      path: `${base}/screenshots/${s.name}.png`,
      device,
    }))
    if (video) {
      const ext = fs.existsSync(path.join(assetRoot, 'demo.mp4')) ? 'mp4' : 'webm'
      entry.demoVideo = { path: `${base}/demo.${ext}`, device }
    }
    fs.writeFileSync(appsPath, JSON.stringify(appsData, null, 2) + '\n')
    console.log(`Updated apps.json entry for "${slug}"`)
  }

  console.log('Done.')
}

run().catch(err => {
  console.error(err)
  process.exit(1)
})
