export function assetPaths(slug: string) {
  const fsRoot = `public/assets/${slug}`
  const urlRoot = `/assets/${slug}`
  return {
    // Filesystem paths (relative to project root) — for reading/writing files
    fsRoot,
    fsIconPng: `${fsRoot}/icon.png`,
    fsIconSvg: `${fsRoot}/icon.svg`,
    fsScreenshotsDir: `${fsRoot}/screenshots`,
    fsDemoVideo: `${fsRoot}/demo.mp4`,
    // URL paths (relative to public/) — for storing in apps.json
    urlIconPng: `${urlRoot}/icon.png`,
    urlIconSvg: `${urlRoot}/icon.svg`,
    urlDemoVideo: `${urlRoot}/demo.mp4`,
    urlScreenshot: (filename: string) => `${urlRoot}/screenshots/${filename}`,
  }
}

// Enforces the 01-description.png naming convention for screenshots.
export function screenshotFilename(index: number, description: string): string {
  const n = String(index).padStart(2, '0')
  const label = description
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${n}-${label}.png`
}
