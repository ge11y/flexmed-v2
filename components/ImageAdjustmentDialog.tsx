'use client'

import { useState } from 'react'

type ImageAdjustmentDialogProps = {
  title: string
  fileName?: string
  sourceUrl: string
  outputName: string
  outputWidth?: number
  outputHeight?: number
  previewAspectRatio?: string
  onClose: () => void
  onSave: (file: File) => Promise<void> | void
}

type EditorState = {
  zoom: number
  rotation: number
  offsetX: number
  offsetY: number
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function loadPreviewImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image()
    image.crossOrigin = 'anonymous'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Image could not be loaded for editing.'))
    image.src = src
  })
}

function safeFileName(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function createAdjustedImageFile(args: {
  sourceUrl: string
  outputName: string
  outputWidth: number
  outputHeight: number
  editor: EditorState
}) {
  const image = await loadPreviewImage(args.sourceUrl)
  const canvas = document.createElement('canvas')
  canvas.width = args.outputWidth
  canvas.height = args.outputHeight
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Image editor is not available in this browser.')

  const radians = (args.editor.rotation * Math.PI) / 180
  const rotatedWidth = Math.abs(image.width * Math.cos(radians)) + Math.abs(image.height * Math.sin(radians))
  const rotatedHeight = Math.abs(image.width * Math.sin(radians)) + Math.abs(image.height * Math.cos(radians))
  const containScale = Math.min(args.outputWidth / rotatedWidth, args.outputHeight / rotatedHeight)
  const scale = containScale * args.editor.zoom

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, args.outputWidth, args.outputHeight)
  context.save()
  context.translate(
    args.outputWidth / 2 + (args.editor.offsetX / 100) * args.outputWidth,
    args.outputHeight / 2 + (args.editor.offsetY / 100) * args.outputHeight,
  )
  context.rotate(radians)
  context.drawImage(image, (-image.width * scale) / 2, (-image.height * scale) / 2, image.width * scale, image.height * scale)
  context.restore()

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) resolve(result)
      else reject(new Error('Adjusted image could not be created.'))
    }, 'image/png')
  })

  return new File([blob], `${safeFileName(args.outputName) || 'adjusted-image'}.png`, { type: 'image/png' })
}

export function ImageAdjustmentDialog({
  title,
  fileName,
  sourceUrl,
  outputName,
  outputWidth = 1200,
  outputHeight = 900,
  previewAspectRatio = '4 / 3',
  onClose,
  onSave,
}: ImageAdjustmentDialogProps) {
  const [editor, setEditor] = useState<EditorState>({ zoom: 1, rotation: 0, offsetX: 0, offsetY: 0 })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  function updateEditor(patch: Partial<EditorState>) {
    setEditor((current) => ({ ...current, ...patch }))
  }

  async function saveAdjustedImage() {
    setSaving(true)
    setError('')
    try {
      const file = await createAdjustedImageFile({ sourceUrl, outputName, outputWidth, outputHeight, editor })
      await onSave(file)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Adjusted image could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Adjust ${title}`}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 90,
        background: 'rgba(6, 12, 28, 0.72)',
        display: 'grid',
        placeItems: 'center',
        padding: '24px',
      }}
    >
      <div
        className="card"
        style={{
          width: 'min(920px, 100%)',
          maxHeight: '92vh',
          overflow: 'auto',
          padding: '20px',
          display: 'grid',
          gap: '18px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'start', flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: '6px' }}>
            <div className="section-label">Adjust Image</div>
            <h2 style={{ margin: 0, fontSize: '22px' }}>{title}</h2>
            {fileName ? <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{fileName}</div> : null}
          </div>
          <button type="button" className="fm-btn-outline" onClick={onClose} disabled={saving}>
            Close
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(260px, 0.8fr)', gap: '18px', alignItems: 'start' }}>
          <div
            style={{
              position: 'relative',
              aspectRatio: previewAspectRatio,
              overflow: 'hidden',
              borderRadius: '8px',
              border: '1px solid var(--accent-400)',
              background: 'var(--bg-elevated)',
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element -- Blob previews and same-origin proxies are not handled by the Next image optimizer. */}
            <img
              src={sourceUrl}
              alt={`${title} preview`}
              style={{
                position: 'absolute',
                left: '50%',
                top: '50%',
                width: '100%',
                height: '100%',
                objectFit: 'contain',
                transform: `translate(-50%, -50%) translate(${editor.offsetX}%, ${editor.offsetY}%) rotate(${editor.rotation}deg) scale(${editor.zoom})`,
                transformOrigin: 'center',
              }}
            />
          </div>

          <div style={{ display: 'grid', gap: '14px' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <div className="section-label">Size</div>
              <input type="range" min="0.35" max="2.6" step="0.05" value={editor.zoom} onChange={(event) => updateEditor({ zoom: Number(event.target.value) })} />
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px' }}>
                <span>Shrink</span>
                <strong>{Math.round(editor.zoom * 100)}%</strong>
                <span>Expand</span>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <div className="section-label">Rotation</div>
              <input type="range" min="-180" max="180" step="1" value={editor.rotation} onChange={(event) => updateEditor({ rotation: Number(event.target.value) })} />
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button type="button" className="fm-btn-outline" style={{ padding: '8px 12px', fontSize: '12px' }} onClick={() => updateEditor({ rotation: editor.rotation - 90 })}>
                  Rotate Left
                </button>
                <button type="button" className="fm-btn-outline" style={{ padding: '8px 12px', fontSize: '12px' }} onClick={() => updateEditor({ rotation: editor.rotation + 90 })}>
                  Rotate Right
                </button>
              </div>
            </div>

            <div style={{ display: 'grid', gap: '8px' }}>
              <div className="section-label">Position</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
                <span />
                <button type="button" className="fm-btn-outline" style={{ padding: '8px 10px', fontSize: '12px' }} onClick={() => updateEditor({ offsetY: clamp(editor.offsetY - 5, -35, 35) })}>
                  Up
                </button>
                <span />
                <button type="button" className="fm-btn-outline" style={{ padding: '8px 10px', fontSize: '12px' }} onClick={() => updateEditor({ offsetX: clamp(editor.offsetX - 5, -35, 35) })}>
                  Left
                </button>
                <button type="button" className="fm-btn-outline" style={{ padding: '8px 10px', fontSize: '12px' }} onClick={() => updateEditor({ offsetX: 0, offsetY: 0 })}>
                  Center
                </button>
                <button type="button" className="fm-btn-outline" style={{ padding: '8px 10px', fontSize: '12px' }} onClick={() => updateEditor({ offsetX: clamp(editor.offsetX + 5, -35, 35) })}>
                  Right
                </button>
                <span />
                <button type="button" className="fm-btn-outline" style={{ padding: '8px 10px', fontSize: '12px' }} onClick={() => updateEditor({ offsetY: clamp(editor.offsetY + 5, -35, 35) })}>
                  Down
                </button>
                <span />
              </div>
            </div>

            {error ? <div style={{ color: 'var(--error)', fontSize: '13px' }}>{error}</div> : null}

            <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', flexWrap: 'wrap', paddingTop: '4px' }}>
              <button type="button" className="fm-btn-outline" onClick={() => setEditor({ zoom: 1, rotation: 0, offsetX: 0, offsetY: 0 })} disabled={saving}>
                Reset
              </button>
              <button type="button" className="fm-btn-primary" onClick={() => void saveAdjustedImage()} disabled={saving}>
                {saving ? 'Saving Image...' : 'Use Adjusted Image'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
