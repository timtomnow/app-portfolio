import { useState, useRef } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { X, Upload, CheckCircle2, ArrowLeft } from 'lucide-react'
import type { AppEntry, DeviceType, Screenshot } from '../types'
import { saveApp } from './saveApps'
import { assetPaths, screenshotFilename } from './assetPaths'
import { assetUrl } from '../utils'

type Props = {
  initial?: AppEntry
  onSaved: (app: AppEntry) => void
  onCancel: () => void
}

type PendingIcon = { file: File; preview: string; ext: 'png' | 'svg' }
type PendingShot = { file: File; preview: string; caption: string }

const COMPLEXITY_VALS = [1, 2, 3, 4, 5] as const
type Complexity = (typeof COMPLEXITY_VALS)[number]

function toBase64(file: File): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader()
    reader.onload = () => resolve((reader.result as string).split(',')[1])
    reader.readAsDataURL(file)
  })
}

const inputCls =
  'w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-accent-400 focus:border-transparent'

type FieldProps = { label: string; required?: boolean; hint?: string; children: ReactNode }
function Field({ label, required, hint, children }: FieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-widest pt-2">
      {children}
    </h2>
  )
}

export default function AppForm({ initial, onSaved, onCancel }: Props) {
  const isNew = !initial

  const [name, setName] = useState(initial?.name ?? '')
  const [slug, setSlug] = useState(initial?.slug ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [complexity, setComplexity] = useState<Complexity>(initial?.complexity ?? 3)
  const [device, setDevice] = useState<DeviceType>(
    initial?.screenshots[0]?.device ?? initial?.demoVideo?.device ?? 'desktop',
  )
  const [liveUrl, setLiveUrl] = useState(initial?.liveUrl ?? '')
  const [repoUrl, setRepoUrl] = useState(initial?.repoUrl ?? '')

  const [existingShots, setExistingShots] = useState<Screenshot[]>(initial?.screenshots ?? [])
  const [hasExistingVideo, setHasExistingVideo] = useState(!!initial?.demoVideo)
  const [pendingIcon, setPendingIcon] = useState<PendingIcon | null>(null)
  const [pendingShots, setPendingShots] = useState<PendingShot[]>([])
  const [pendingVideo, setPendingVideo] = useState<File | null>(null)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<AppEntry | null>(null)
  const [error, setError] = useState<string | null>(null)

  const iconRef = useRef<HTMLInputElement>(null)
  const shotsRef = useRef<HTMLInputElement>(null)
  const videoRef = useRef<HTMLInputElement>(null)

  function handleNameChange(val: string) {
    setName(val)
    if (isNew) {
      setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''))
    }
  }

  function handleIconFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const ext = f.name.toLowerCase().endsWith('.svg') ? 'svg' : 'png'
    setPendingIcon({ file: f, preview: URL.createObjectURL(f), ext })
  }

  function handleShotFiles(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    setPendingShots(prev => [
      ...prev,
      ...files.map(f => ({ file: f, preview: URL.createObjectURL(f), caption: '' })),
    ])
    e.target.value = ''
  }

  function updateShotCaption(i: number, caption: string) {
    setPendingShots(prev => prev.map((s, idx) => (idx === i ? { ...s, caption } : s)))
  }

  async function handleSubmit() {
    if (!slug.trim() || !name.trim() || !description.trim()) {
      setError('Name, slug, and description are required.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      const paths = assetPaths(slug)
      const now = new Date().toISOString().split('T')[0]

      let iconPath = initial?.iconPath ?? paths.urlIconPng
      if (pendingIcon) {
        iconPath = pendingIcon.ext === 'svg' ? paths.urlIconSvg : paths.urlIconPng
      }

      const newShotUploads = await Promise.all(
        pendingShots.map(async (s, i) => {
          const filename = screenshotFilename(
            existingShots.length + i + 1,
            s.caption || `screenshot-${existingShots.length + i + 1}`,
          )
          return {
            entry: {
              path: paths.urlScreenshot(filename),
              caption: s.caption || undefined,
              device,
            } as Screenshot,
            upload: { data: await toBase64(s.file), name: filename },
          }
        }),
      )

      let demoVideo = initial?.demoVideo
      if (!hasExistingVideo) demoVideo = undefined
      if (pendingVideo) demoVideo = { path: paths.urlDemoVideo, device }

      const iconUpload = pendingIcon
        ? { data: await toBase64(pendingIcon.file), ext: pendingIcon.ext }
        : undefined
      const videoUpload = pendingVideo ? { data: await toBase64(pendingVideo) } : undefined

      const app: AppEntry = {
        slug,
        name,
        description,
        complexity,
        liveUrl: liveUrl.trim() || undefined,
        repoUrl: repoUrl.trim() || undefined,
        iconPath,
        screenshots: [...existingShots, ...newShotUploads.map(u => u.entry)],
        demoVideo,
        createdAt: initial?.createdAt ?? now,
        updatedAt: now,
      }

      await saveApp({
        app,
        files: {
          icon: iconUpload,
          screenshots: newShotUploads.map(u => u.upload),
          demoVideo: videoUpload,
        },
      })

      setSaved(app)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  if (saved) {
    return (
      <div className="max-w-2xl mx-auto px-6 py-20 flex flex-col items-center gap-6 text-center">
        <CheckCircle2 size={48} className="text-accent-500" />
        <div>
          <h2 className="text-xl font-bold text-slate-800">Saved!</h2>
          <p className="mt-2 text-slate-500">
            Changes are written to disk. Run the following to publish:
          </p>
          <pre className="mt-4 bg-slate-100 rounded-lg px-4 py-3 text-sm text-left font-mono text-slate-700 whitespace-pre-wrap">
            {`git add . && git commit -m "update: ${saved.name}" && git push`}
          </pre>
        </div>
        <button
          onClick={() => onSaved(saved)}
          className="bg-accent-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-accent-700 transition-colors"
        >
          Back to list
        </button>
      </div>
    )
  }

  const iconPreview = pendingIcon
    ? pendingIcon.preview
    : initial?.iconPath
      ? assetUrl(initial.iconPath)
      : null

  return (
    <div className="max-w-2xl mx-auto px-6 py-10">
      <button
        onClick={onCancel}
        className="inline-flex items-center gap-1.5 text-sm text-slate-500 hover:text-accent-600 transition-colors mb-8"
      >
        <ArrowLeft size={15} />
        Cancel
      </button>

      <h1 className="text-2xl font-bold text-slate-800 mb-8">
        {isNew ? 'New App' : `Edit: ${initial.name}`}
      </h1>

      <div className="flex flex-col gap-6">
        {/* Identity */}
        <Field label="Name" required>
          <input
            type="text"
            value={name}
            onChange={e => handleNameChange(e.target.value)}
            className={inputCls}
            placeholder="My App"
          />
        </Field>

        <Field
          label="Slug"
          hint={
            isNew
              ? 'Auto-generated from name. Letters, numbers, hyphens only.'
              : 'Slug cannot be changed after creation — it anchors asset paths.'
          }
        >
          <input
            type="text"
            value={slug}
            onChange={e => isNew && setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
            readOnly={!isNew}
            className={`${inputCls} ${!isNew ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}`}
            placeholder="my-app"
          />
        </Field>

        <Field label="Description" required>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            rows={3}
            className={`${inputCls} resize-none`}
            placeholder="1–3 sentences describing the app."
          />
        </Field>

        <Field label="Complexity">
          <div className="flex gap-2">
            {COMPLEXITY_VALS.map(v => (
              <button
                key={v}
                type="button"
                onClick={() => setComplexity(v)}
                className={`w-9 h-9 rounded-full text-sm font-medium transition-colors ${
                  v === complexity
                    ? 'bg-accent-600 text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {v}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Device" hint="Applies to all screenshots and demo video for this app.">
          <div className="flex gap-5">
            {(['desktop', 'mobile'] as const).map(d => (
              <label key={d} className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="device"
                  value={d}
                  checked={device === d}
                  onChange={() => setDevice(d)}
                  className="accent-teal-600"
                />
                <span className="text-sm text-slate-700 capitalize">{d}</span>
              </label>
            ))}
          </div>
        </Field>

        {/* Links */}
        <SectionHeading>Links</SectionHeading>

        <Field label="Live URL">
          <input
            type="url"
            value={liveUrl}
            onChange={e => setLiveUrl(e.target.value)}
            className={inputCls}
            placeholder="https://..."
          />
        </Field>

        <Field label="GitHub repo URL">
          <input
            type="url"
            value={repoUrl}
            onChange={e => setRepoUrl(e.target.value)}
            className={inputCls}
            placeholder="https://github.com/..."
          />
        </Field>

        {/* Icon */}
        <SectionHeading>Icon</SectionHeading>

        <div className="flex items-center gap-4">
          {iconPreview && (
            <img
              src={iconPreview}
              alt="Icon preview"
              className="w-16 h-16 rounded-xl object-cover bg-slate-100 shrink-0"
            />
          )}
          <button
            type="button"
            onClick={() => iconRef.current?.click()}
            className="inline-flex items-center gap-2 text-sm text-slate-600 border border-slate-200 rounded-lg px-4 py-2 hover:border-accent-400 transition-colors"
          >
            <Upload size={15} />
            {pendingIcon ? 'Change icon' : initial?.iconPath ? 'Replace icon' : 'Upload icon'}
          </button>
          <input
            ref={iconRef}
            type="file"
            accept="image/png,image/svg+xml"
            className="hidden"
            onChange={handleIconFile}
          />
        </div>

        {/* Screenshots */}
        <SectionHeading>Screenshots</SectionHeading>

        {existingShots.length > 0 && (
          <div className="flex flex-col gap-2">
            {existingShots.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2"
              >
                <img
                  src={assetUrl(s.path)}
                  alt=""
                  className="w-10 h-10 rounded object-cover bg-slate-200 shrink-0"
                />
                <span className="flex-1 text-sm text-slate-600 truncate">
                  {s.caption ?? s.path.split('/').pop()}
                </span>
                <button
                  type="button"
                  onClick={() => setExistingShots(prev => prev.filter((_, idx) => idx !== i))}
                  className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        {pendingShots.length > 0 && (
          <div className="flex flex-col gap-2">
            {pendingShots.map((s, i) => (
              <div
                key={i}
                className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2"
              >
                <img
                  src={s.preview}
                  alt=""
                  className="w-10 h-10 rounded object-cover shrink-0"
                />
                <input
                  type="text"
                  value={s.caption}
                  onChange={e => updateShotCaption(i, e.target.value)}
                  placeholder="Caption (optional)"
                  className="flex-1 text-sm bg-transparent border-b border-slate-200 focus:border-accent-400 outline-none py-0.5 min-w-0"
                />
                <button
                  type="button"
                  onClick={() => setPendingShots(prev => prev.filter((_, idx) => idx !== i))}
                  className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                >
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => shotsRef.current?.click()}
          className="inline-flex items-center gap-2 text-sm text-slate-600 border border-slate-200 rounded-lg px-4 py-2 hover:border-accent-400 transition-colors self-start"
        >
          <Upload size={15} />
          Add screenshots
        </button>
        <input
          ref={shotsRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={handleShotFiles}
        />

        {/* Demo video */}
        <SectionHeading>Demo Video</SectionHeading>

        <div className="flex items-center gap-3 flex-wrap">
          {hasExistingVideo && !pendingVideo && (
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
              <span className="text-sm text-slate-600">demo.mp4 (existing)</span>
              <button
                type="button"
                onClick={() => setHasExistingVideo(false)}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          )}
          {pendingVideo && (
            <div className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
              <span className="text-sm text-slate-600">{pendingVideo.name}</span>
              <button
                type="button"
                onClick={() => {
                  setPendingVideo(null)
                  if (videoRef.current) videoRef.current.value = ''
                }}
                className="text-slate-400 hover:text-red-500 transition-colors"
              >
                <X size={15} />
              </button>
            </div>
          )}
          {!pendingVideo && (
            <button
              type="button"
              onClick={() => videoRef.current?.click()}
              className="inline-flex items-center gap-2 text-sm text-slate-600 border border-slate-200 rounded-lg px-4 py-2 hover:border-accent-400 transition-colors"
            >
              <Upload size={15} />
              {hasExistingVideo ? 'Replace video' : 'Upload video'}
            </button>
          )}
          <input
            ref={videoRef}
            type="file"
            accept="video/mp4,video/*"
            className="hidden"
            onChange={e => setPendingVideo(e.target.files?.[0] ?? null)}
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-4 py-3">{error}</p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={saving}
            className="bg-accent-600 text-white text-sm font-medium px-5 py-2.5 rounded-lg hover:bg-accent-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving…' : 'Save app'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="text-sm font-medium text-slate-500 hover:text-slate-800 px-4 py-2.5 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
