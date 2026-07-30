'use client'

import Image from 'next/image'
import { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { AdminShell } from '@/components/AdminShell'
import type { VialCaseRecord } from '@/lib/vial-cases'

const emptyForm = {
  id: '',
  name: '',
  description: '',
  priceLabel: '',
  publicVisible: true,
  archived: false,
  sortOrder: '0',
}

type ImageEditorState = {
  caseId: string
  caseName: string
  fileName: string
  previewUrl: string
  zoom: number
  rotation: number
  offsetX: number
  offsetY: number
  saving: boolean
}

const EDITED_IMAGE_WIDTH = 1200
const EDITED_IMAGE_HEIGHT = 900

function getImageSrc(vialCase: VialCaseRecord) {
  if (!vialCase.imageUrl) return ''
  return withVersion(vialCase.imageUrl, vialCase.updatedAt)
}

function withVersion(url: string, version?: string) {
  if (!version) return url
  return `${url}${url.includes('?') ? '&' : '?'}v=${encodeURIComponent(version)}`
}

function getCaseImages(vialCase: VialCaseRecord) {
  if (vialCase.images.length > 0) return vialCase.images
  return vialCase.imageUrl
    ? [{ id: 'front', url: vialCase.imageUrl, label: 'Front', isPrimary: true, sortOrder: 0 }]
    : []
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function loadPreviewImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Image could not be loaded for editing.'))
    image.src = src
  })
}

async function createAdjustedImageFile(editor: ImageEditorState) {
  const image = await loadPreviewImage(editor.previewUrl)
  const canvas = document.createElement('canvas')
  canvas.width = EDITED_IMAGE_WIDTH
  canvas.height = EDITED_IMAGE_HEIGHT
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Image editor is not available in this browser.')

  const radians = (editor.rotation * Math.PI) / 180
  const rotatedWidth = Math.abs(image.width * Math.cos(radians)) + Math.abs(image.height * Math.sin(radians))
  const rotatedHeight = Math.abs(image.width * Math.sin(radians)) + Math.abs(image.height * Math.cos(radians))
  const containScale = Math.min(EDITED_IMAGE_WIDTH / rotatedWidth, EDITED_IMAGE_HEIGHT / rotatedHeight)
  const scale = containScale * editor.zoom

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, EDITED_IMAGE_WIDTH, EDITED_IMAGE_HEIGHT)
  context.save()
  context.translate(
    EDITED_IMAGE_WIDTH / 2 + (editor.offsetX / 100) * EDITED_IMAGE_WIDTH,
    EDITED_IMAGE_HEIGHT / 2 + (editor.offsetY / 100) * EDITED_IMAGE_HEIGHT,
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

  const safeName = editor.caseName
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return new File([blob], `${safeName || editor.caseId}-vial-case.png`, { type: 'image/png' })
}

export default function AdminVialCasesPage() {
  const [cases, setCases] = useState<VialCaseRecord[]>([])
  const [form, setForm] = useState(emptyForm)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [uploadingId, setUploadingId] = useState<string | null>(null)
  const [imageEditor, setImageEditor] = useState<ImageEditorState | null>(null)
  const [caseReorderMode, setCaseReorderMode] = useState(false)
  const [caseReorderIds, setCaseReorderIds] = useState<string[]>([])
  const [caseReorderSaving, setCaseReorderSaving] = useState(false)
  const [pendingCaseImage, setPendingCaseImage] = useState<File | null>(null)
  const [failedImageUrls, setFailedImageUrls] = useState<Set<string>>(() => new Set())

  const activeCases = useMemo(() => cases.filter((vialCase) => !vialCase.archived), [cases])
  const archivedCases = useMemo(() => cases.filter((vialCase) => vialCase.archived), [cases])
  const activeCaseIds = useMemo(() => new Set(activeCases.map((vialCase) => vialCase.id)), [activeCases])
  const activeCaseReorderIds = useMemo(
    () => caseReorderIds.filter((id) => activeCaseIds.has(id)),
    [activeCaseIds, caseReorderIds],
  )
  const caseReorderComplete = caseReorderMode && activeCases.length > 0 && activeCaseReorderIds.length === activeCases.length

  async function refreshCases() {
    try {
      const response = await fetch('/api/admin/vial-cases', { cache: 'no-store' })
      const result = (await response.json()) as { ok?: boolean; cases?: VialCaseRecord[]; error?: string }
      if (!response.ok || !result.ok) {
        setMessage(result.error || 'Vial cases could not be loaded.')
        setCases(result.cases ?? [])
        return
      }
      setCases(result.cases ?? [])
    } catch {
      setMessage('Vial cases could not be loaded.')
    }
  }

  useEffect(() => {
    let active = true

    async function loadCases() {
      try {
        const response = await fetch('/api/admin/vial-cases', { cache: 'no-store' })
        const result = (await response.json()) as { ok?: boolean; cases?: VialCaseRecord[]; error?: string }
        if (!active) return
        if (!response.ok || !result.ok) {
          setMessage(result.error || 'Vial cases could not be loaded.')
          setCases(result.cases ?? [])
          return
        }
        setCases(result.cases ?? [])
      } catch {
        if (active) setMessage('Vial cases could not be loaded.')
      } finally {
        if (active) setLoading(false)
      }
    }

    void loadCases()
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    return () => {
      if (imageEditor?.previewUrl) URL.revokeObjectURL(imageEditor.previewUrl)
    }
  }, [imageEditor?.previewUrl])

  function resetForm() {
    setForm(emptyForm)
    setPendingCaseImage(null)
  }

  function markImageFailed(url: string) {
    setFailedImageUrls((current) => {
      if (current.has(url)) return current
      const next = new Set(current)
      next.add(url)
      return next
    })
  }

  async function uploadCaseImageFile(caseId: string, caseName: string, file: File, makePrimary: boolean) {
    const previewUrl = URL.createObjectURL(file)

    try {
      const adjustedFile = await createAdjustedImageFile({
        caseId,
        caseName,
        fileName: file.name,
        previewUrl,
        zoom: 1,
        rotation: 0,
        offsetX: 0,
        offsetY: 0,
        saving: false,
      })
      const formData = new FormData()
      formData.append('file', adjustedFile)
      if (makePrimary) formData.append('makePrimary', 'true')

      const response = await fetch(`/api/admin/vial-cases/${caseId}/image`, {
        method: 'POST',
        body: formData,
      })
      const result = (await response.json()) as { ok?: boolean; error?: string; detail?: string }
      if (!response.ok || !result.ok) {
        return result.detail || result.error || 'Image could not be uploaded.'
      }
      return ''
    } catch {
      return 'Image could not be uploaded.'
    } finally {
      URL.revokeObjectURL(previewUrl)
    }
  }

  function startEdit(vialCase: VialCaseRecord) {
    setForm({
      id: vialCase.id,
      name: vialCase.name,
      description: vialCase.description,
      priceLabel: vialCase.priceLabel,
      publicVisible: vialCase.archived ? true : vialCase.publicVisible,
      archived: false,
      sortOrder: String(vialCase.sortOrder ?? 0),
    })
  }

  async function saveCase() {
    if (!form.name.trim() || !form.priceLabel.trim()) {
      setMessage('Add the case name and price before saving.')
      return
    }

    setSaving(true)
    setMessage('')
    try {
      const response = await fetch('/api/admin/vial-cases', {
        method: form.id ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: form.id || undefined,
          name: form.name,
          description: form.description,
          priceLabel: form.priceLabel,
          publicVisible: form.publicVisible,
          archived: form.archived,
          sortOrder: Number(form.sortOrder || '0'),
        }),
      })
      const result = (await response.json()) as {
        ok?: boolean
        error?: string
        detail?: string
        case?: { id?: string; name?: string }
      }
      if (!response.ok || !result.ok) {
        setMessage(result.detail || result.error || 'Vial case could not be saved.')
        return
      }

      const savedCaseId = result.case?.id || form.id
      const savedCaseName = result.case?.name || form.name
      const selectedImage = pendingCaseImage
      let imageError = ''
      if (selectedImage && savedCaseId) {
        setUploadingId(savedCaseId)
        imageError = await uploadCaseImageFile(savedCaseId, savedCaseName, selectedImage, true)
        setUploadingId(null)
      }

      setMessage(
        imageError
          ? `Vial case saved, but ${imageError}`
          : selectedImage
            ? 'Vial case and image saved.'
            : form.id
              ? 'Vial case updated.'
              : 'Vial case added.',
      )
      resetForm()
      await refreshCases()
    } catch {
      setMessage('Vial case could not be saved.')
    } finally {
      setUploadingId(null)
      setSaving(false)
    }
  }

  function handlePendingCaseImage(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null
    if (!file) {
      setPendingCaseImage(null)
      return
    }

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setMessage('Use a PNG, JPG, JPEG, or WEBP image for vial cases.')
      setPendingCaseImage(null)
      event.target.value = ''
      return
    }

    setMessage('')
    setPendingCaseImage(file)
  }

  async function removeCase(id: string) {
    const confirmed = window.confirm('Remove this vial case from the public list?')
    if (!confirmed) return

    try {
      const response = await fetch('/api/admin/vial-cases', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const result = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || !result.ok) {
        setMessage(result.error || 'Vial case could not be removed.')
        return
      }
      setMessage('Vial case removed from the public list.')
      if (form.id === id) resetForm()
      await refreshCases()
    } catch {
      setMessage('Vial case could not be removed.')
    }
  }

  function beginCaseReorder() {
    if (activeCases.length < 2) {
      setMessage('Add at least two vial cases before rearranging.')
      return
    }
    setCaseReorderMode(true)
    setCaseReorderIds([])
    setMessage('Rearrange mode is on. Click each vial case in the order it should appear.')
  }

  function cancelCaseReorder() {
    setCaseReorderMode(false)
    setCaseReorderIds([])
    setMessage('')
  }

  function toggleCaseReorderPick(id: string) {
    if (!caseReorderMode || caseReorderSaving) return
    setCaseReorderIds((current) => {
      const visibleCurrent = current.filter((item) => activeCaseIds.has(item))
      return visibleCurrent.includes(id)
        ? visibleCurrent.filter((item) => item !== id)
        : [...visibleCurrent, id]
    })
  }

  async function saveCaseReorder() {
    if (!caseReorderComplete) {
      setMessage('Click every active vial case once before saving the new order.')
      return
    }

    setCaseReorderSaving(true)
    setMessage('')
    try {
      const reorder = activeCaseReorderIds.map((id, index) => ({
        id,
        sortOrder: (index + 1) * 10,
      }))
      const response = await fetch('/api/admin/vial-cases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reorder }),
      })
      const result = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || !result.ok) {
        setMessage(result.error || 'Vial case order could not be saved.')
        return
      }

      const orderMap = new Map(reorder.map((item) => [item.id, item.sortOrder]))
      setCases((current) =>
        current
          .map((vialCase) => (
            orderMap.has(vialCase.id)
              ? { ...vialCase, sortOrder: orderMap.get(vialCase.id) ?? vialCase.sortOrder }
              : vialCase
          ))
          .sort((a, b) => {
            if (a.archived !== b.archived) return Number(a.archived) - Number(b.archived)
            if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder
            return a.name.localeCompare(b.name)
          }),
      )
      setCaseReorderMode(false)
      setCaseReorderIds([])
      setMessage('Vial case display order saved.')
      await refreshCases()
    } catch {
      setMessage('Vial case order could not be saved.')
    } finally {
      setCaseReorderSaving(false)
    }
  }

  function openImageEditor(id: string, caseName: string, event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setMessage('Use a PNG, JPG, JPEG, or WEBP image for vial cases.')
      event.target.value = ''
      return
    }

    setMessage('')
    setImageEditor({
      caseId: id,
      caseName,
      fileName: file.name,
      previewUrl: URL.createObjectURL(file),
      zoom: 1,
      rotation: 0,
      offsetX: 0,
      offsetY: 0,
      saving: false,
    })
    event.target.value = ''
  }

  function updateImageEditor(patch: Partial<ImageEditorState>) {
    setImageEditor((current) => (current ? { ...current, ...patch } : current))
  }

  function closeImageEditor() {
    setImageEditor(null)
  }

  async function uploadEditedImage() {
    if (!imageEditor) return

    setUploadingId(imageEditor.caseId)
    setMessage('')
    setImageEditor((current) => (current ? { ...current, saving: true } : current))
    try {
      const adjustedFile = await createAdjustedImageFile(imageEditor)
      const formData = new FormData()
      formData.append('file', adjustedFile)
      const existingCase = cases.find((vialCase) => vialCase.id === imageEditor.caseId)
      if (!existingCase || getCaseImages(existingCase).length === 0) {
        formData.append('makePrimary', 'true')
      }

      const response = await fetch(`/api/admin/vial-cases/${imageEditor.caseId}/image`, {
        method: 'POST',
        body: formData,
      })
      const result = (await response.json()) as { ok?: boolean; error?: string; detail?: string }
      if (!response.ok || !result.ok) {
        setMessage(result.detail || result.error || 'Image could not be uploaded.')
        return
      }
      setMessage('Vial case image added.')
      await refreshCases()
      setImageEditor(null)
    } catch {
      setMessage('Image could not be uploaded.')
    } finally {
      setUploadingId(null)
      setImageEditor((current) => (current ? { ...current, saving: false } : current))
    }
  }

  async function updateCaseGallery(vialCase: VialCaseRecord, imageGallery: VialCaseRecord['images'], successMessage: string) {
    try {
      const response = await fetch('/api/admin/vial-cases', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: vialCase.id,
          name: vialCase.name,
          description: vialCase.description,
          priceLabel: vialCase.priceLabel,
          priceAmount: vialCase.priceAmount,
          publicVisible: vialCase.publicVisible,
          archived: vialCase.archived,
          sortOrder: vialCase.sortOrder,
          imageGallery,
        }),
      })
      const result = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || !result.ok) {
        setMessage(result.error || 'Image order could not be updated.')
        return
      }
      setMessage(successMessage)
      await refreshCases()
    } catch {
      setMessage('Image order could not be updated.')
    }
  }

  async function makePrimaryImage(vialCase: VialCaseRecord, imageId: string) {
    const nextGallery = getCaseImages(vialCase).map((image, index) => ({
      ...image,
      isPrimary: image.id === imageId,
      sortOrder: index,
    }))
    await updateCaseGallery(vialCase, nextGallery, 'Primary vial case image updated.')
  }

  async function moveImage(vialCase: VialCaseRecord, imageId: string, direction: -1 | 1) {
    const images = [...getCaseImages(vialCase)]
    const index = images.findIndex((image) => image.id === imageId)
    const targetIndex = index + direction
    if (index < 0 || targetIndex < 0 || targetIndex >= images.length) return
    const [image] = images.splice(index, 1)
    images.splice(targetIndex, 0, image)
    const nextGallery = images.map((entry, nextIndex) => ({ ...entry, sortOrder: nextIndex }))
    await updateCaseGallery(vialCase, nextGallery, 'Vial case images reordered.')
  }

  async function removeImage(id: string, imageId?: string) {
    try {
      const response = await fetch(`/api/admin/vial-cases/${id}/image${imageId ? `?image=${encodeURIComponent(imageId)}` : ''}`, { method: 'DELETE' })
      const result = (await response.json()) as { ok?: boolean; error?: string }
      if (!response.ok || !result.ok) {
        setMessage(result.error || 'Image could not be removed.')
        return
      }
      setMessage(imageId ? 'Vial case image removed.' : 'All vial case images removed.')
      await refreshCases()
    } catch {
      setMessage('Image could not be removed.')
    }
  }

  return (
    <AdminShell
      active="/admin/vial-cases"
      title="Vial Cases"
      description="Add, price, image, hide, and remove vial-case products from the public vial-cases page."
      purpose="This keeps case pricing and product images in one shared admin source so every device sees the same public vial-case list."
      workflow={[
        'Add or edit the case name and price.',
        'Upload a product image when available.',
        'Hide or remove cases that should not appear on the storefront.',
      ]}
    >
      <style jsx>{`
        .case-reorder-controls {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          flex-wrap: wrap;
          gap: 10px;
        }
        .case-reorder-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          border: 1px solid var(--amber-border);
          border-radius: 10px;
          background: var(--amber-muted);
          padding: 12px 14px;
          color: var(--text-secondary);
          font-size: 13px;
        }
        .case-reorder-actions {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 8px;
        }
        .case-rank-pill {
          border: 1px solid var(--border);
          border-radius: 999px;
          background: var(--bg-card);
          color: var(--text-secondary);
          padding: 7px 10px;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }
        .case-rank-pill[data-selected='true'] {
          border-color: var(--accent-500);
          background: var(--accent-500);
          color: #fff;
        }
        @media (max-width: 680px) {
          .case-reorder-controls,
          .case-reorder-actions {
            width: 100%;
          }
          .case-reorder-controls > *,
          .case-reorder-actions > * {
            flex: 1 1 100%;
          }
        }
      `}</style>
      <div style={{ display: 'grid', gap: '18px' }}>
        {message ? (
          <div className="card" style={{ padding: '14px 16px', color: 'var(--text-secondary)' }}>
            {message}
          </div>
        ) : null}

        {imageEditor ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Adjust vial case image"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 80,
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
                  <h2 style={{ margin: 0, fontSize: '22px' }}>{imageEditor.caseName}</h2>
                  <div style={{ color: 'var(--text-muted)', fontSize: '12px' }}>{imageEditor.fileName}</div>
                </div>
                <button type="button" className="fm-btn-outline" onClick={closeImageEditor} disabled={imageEditor.saving}>
                  Close
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.2fr) minmax(260px, 0.8fr)', gap: '18px', alignItems: 'start' }}>
                <div
                  style={{
                    position: 'relative',
                    aspectRatio: '4 / 3',
                    overflow: 'hidden',
                    borderRadius: '8px',
                    border: '1px solid var(--accent-400)',
                    background: 'var(--bg-elevated)',
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- Browser blob previews are not handled by the Next image optimizer. */}
                  <img
                    src={imageEditor.previewUrl}
                    alt={`${imageEditor.caseName} preview`}
                    style={{
                      position: 'absolute',
                      left: '50%',
                      top: '50%',
                      width: '100%',
                      height: '100%',
                      objectFit: 'contain',
                      transform: `translate(-50%, -50%) translate(${imageEditor.offsetX}%, ${imageEditor.offsetY}%) rotate(${imageEditor.rotation}deg) scale(${imageEditor.zoom})`,
                      transformOrigin: 'center',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gap: '14px' }}>
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <div className="section-label">Size</div>
                    <input
                      type="range"
                      min="0.35"
                      max="2.6"
                      step="0.05"
                      value={imageEditor.zoom}
                      onChange={(event) => updateImageEditor({ zoom: Number(event.target.value) })}
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '12px' }}>
                      <span>Shrink</span>
                      <strong>{Math.round(imageEditor.zoom * 100)}%</strong>
                      <span>Expand</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '8px' }}>
                    <div className="section-label">Rotation</div>
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={imageEditor.rotation}
                      onChange={(event) => updateImageEditor({ rotation: Number(event.target.value) })}
                    />
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        className="fm-btn-outline"
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                        onClick={() => updateImageEditor({ rotation: imageEditor.rotation - 90 })}
                      >
                        Rotate Left
                      </button>
                      <button
                        type="button"
                        className="fm-btn-outline"
                        style={{ padding: '8px 12px', fontSize: '12px' }}
                        onClick={() => updateImageEditor({ rotation: imageEditor.rotation + 90 })}
                      >
                        Rotate Right
                      </button>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gap: '8px' }}>
                    <div className="section-label">Position</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
                      <span />
                      <button
                        type="button"
                        className="fm-btn-outline"
                        style={{ padding: '8px 10px', fontSize: '12px' }}
                        onClick={() => updateImageEditor({ offsetY: clamp(imageEditor.offsetY - 5, -35, 35) })}
                      >
                        Up
                      </button>
                      <span />
                      <button
                        type="button"
                        className="fm-btn-outline"
                        style={{ padding: '8px 10px', fontSize: '12px' }}
                        onClick={() => updateImageEditor({ offsetX: clamp(imageEditor.offsetX - 5, -35, 35) })}
                      >
                        Left
                      </button>
                      <button
                        type="button"
                        className="fm-btn-outline"
                        style={{ padding: '8px 10px', fontSize: '12px' }}
                        onClick={() => updateImageEditor({ offsetX: 0, offsetY: 0 })}
                      >
                        Center
                      </button>
                      <button
                        type="button"
                        className="fm-btn-outline"
                        style={{ padding: '8px 10px', fontSize: '12px' }}
                        onClick={() => updateImageEditor({ offsetX: clamp(imageEditor.offsetX + 5, -35, 35) })}
                      >
                        Right
                      </button>
                      <span />
                      <button
                        type="button"
                        className="fm-btn-outline"
                        style={{ padding: '8px 10px', fontSize: '12px' }}
                        onClick={() => updateImageEditor({ offsetY: clamp(imageEditor.offsetY + 5, -35, 35) })}
                      >
                        Down
                      </button>
                      <span />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', flexWrap: 'wrap', paddingTop: '4px' }}>
                    <button
                      type="button"
                      className="fm-btn-outline"
                      onClick={() => updateImageEditor({ zoom: 1, rotation: 0, offsetX: 0, offsetY: 0 })}
                      disabled={imageEditor.saving}
                    >
                      Reset
                    </button>
                    <button type="button" className="fm-btn-primary" onClick={() => void uploadEditedImage()} disabled={imageEditor.saving}>
                      {imageEditor.saving ? 'Saving Image...' : 'Save Adjusted Image'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="card" style={{ padding: '20px', display: 'grid', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <div className="section-label">{form.id ? 'Edit Vial Case' : 'Add Vial Case'}</div>
              <h2 style={{ margin: '6px 0 0', fontSize: '22px' }}>{form.id ? form.name || 'Selected case' : 'New case listing'}</h2>
            </div>
            {form.id ? (
              <button type="button" className="fm-btn-outline" onClick={resetForm}>
                New Case
              </button>
            ) : null}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(220px, 1.2fr) minmax(150px, 0.7fr) minmax(120px, 0.4fr)', gap: '12px' }}>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span className="section-label">Case Name</span>
              <input
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="3ml 10 ct"
                style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px' }}
              />
            </label>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span className="section-label">Price</span>
              <input
                value={form.priceLabel}
                onChange={(event) => setForm((current) => ({ ...current, priceLabel: event.target.value }))}
                placeholder="$12"
                style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px' }}
              />
            </label>
            <label style={{ display: 'grid', gap: '8px' }}>
              <span className="section-label">Order</span>
              <input
                type="number"
                value={form.sortOrder}
                onChange={(event) => setForm((current) => ({ ...current, sortOrder: event.target.value }))}
                style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px' }}
              />
            </label>
          </div>

          <label style={{ display: 'grid', gap: '8px' }}>
            <span className="section-label">Description</span>
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              placeholder="Short display note for the public page"
              rows={3}
              style={{ borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-primary)', padding: '12px', resize: 'vertical' }}
            />
          </label>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: '12px',
              alignItems: 'center',
              flexWrap: 'wrap',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              padding: '12px',
              background: 'var(--bg-elevated)',
            }}
          >
            <div style={{ display: 'grid', gap: '4px' }}>
              <span className="section-label">Image</span>
              <span style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                {pendingCaseImage
                  ? pendingCaseImage.name
                  : 'Optional. Choose an image here, then save the case to upload it.'}
              </span>
            </div>
            <label className="fm-btn-outline" style={{ padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}>
              {pendingCaseImage ? 'Change Image' : 'Choose Image'}
              <input type="file" accept="image/png,image/jpeg,image/webp" onChange={handlePendingCaseImage} style={{ display: 'none' }} />
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ display: 'inline-flex', gap: '10px', alignItems: 'center', color: 'var(--text-secondary)' }}>
              <input
                type="checkbox"
                checked={form.publicVisible}
                onChange={(event) => setForm((current) => ({ ...current, publicVisible: event.target.checked }))}
              />
              Show publicly
            </label>
            <button type="button" className="fm-btn-primary" onClick={() => void saveCase()} disabled={saving}>
              {saving ? (pendingCaseImage ? 'Saving Case + Image...' : 'Saving...') : form.id ? 'Save Case' : 'Add Vial Case'}
            </button>
          </div>
        </div>

        <div className="card" style={{ padding: '20px', display: 'grid', gap: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'end', flexWrap: 'wrap' }}>
            <div>
              <div className="section-label">Active Case Products</div>
              <h2 style={{ margin: '6px 0 0', fontSize: '22px' }}>{loading ? 'Loading cases...' : `${activeCases.length} active`}</h2>
            </div>
            <div className="case-reorder-controls">
              <button
                type="button"
                className={caseReorderMode ? 'fm-btn-primary' : 'fm-btn-outline'}
                disabled={loading || caseReorderSaving || activeCases.length < 2}
                title={activeCases.length < 2 ? 'Add at least two vial cases before rearranging.' : undefined}
                onClick={caseReorderMode ? cancelCaseReorder : beginCaseReorder}
                style={{ padding: '10px 14px', fontSize: '13px' }}
              >
                {caseReorderMode ? 'Cancel rearrange' : 'Rearrange'}
              </button>
            </div>
          </div>

          {caseReorderMode ? (
            <div className="case-reorder-bar" role="status">
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Click cases in display order.</strong>{' '}
                {activeCaseReorderIds.length}/{activeCases.length} selected.
              </div>
              <div className="case-reorder-actions">
                <button
                  type="button"
                  className="fm-btn-outline"
                  disabled={caseReorderSaving || activeCaseReorderIds.length === 0}
                  onClick={() => setCaseReorderIds([])}
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                >
                  Reset picks
                </button>
                <button
                  type="button"
                  className="fm-btn-primary"
                  disabled={caseReorderSaving || !caseReorderComplete}
                  onClick={() => {
                    void saveCaseReorder()
                  }}
                  style={{ padding: '8px 12px', fontSize: '12px' }}
                >
                  {caseReorderSaving ? 'Saving...' : 'Save order'}
                </button>
              </div>
            </div>
          ) : null}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '14px' }}>
            {activeCases.map((vialCase) => {
              const imageSrc = getImageSrc(vialCase)
              const gallery = getCaseImages(vialCase)
              const visibleImageSrc = imageSrc && !failedImageUrls.has(imageSrc) ? imageSrc : ''
              const reorderIndex = activeCaseReorderIds.indexOf(vialCase.id)
              const reorderSelected = reorderIndex >= 0
              const nextPickNumber = activeCaseReorderIds.length + 1
              return (
                <article
                  key={vialCase.id}
                  role={caseReorderMode ? 'button' : undefined}
                  tabIndex={caseReorderMode ? 0 : undefined}
                  aria-pressed={caseReorderMode ? reorderSelected : undefined}
                  onClick={caseReorderMode ? () => toggleCaseReorderPick(vialCase.id) : undefined}
                  onKeyDown={
                    caseReorderMode
                      ? (event) => {
                          if (event.key !== 'Enter' && event.key !== ' ') return
                          event.preventDefault()
                          toggleCaseReorderPick(vialCase.id)
                        }
                      : undefined
                  }
                  style={{
                    border: reorderSelected ? '1px solid var(--accent-400)' : '1px solid var(--border)',
                    borderRadius: '8px',
                    background: reorderSelected ? 'rgba(42, 79, 174, 0.06)' : 'var(--bg-card)',
                    overflow: 'hidden',
                    display: 'grid',
                    alignContent: 'start',
                    cursor: caseReorderMode ? 'pointer' : 'default',
                    outlineOffset: '3px',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      aspectRatio: '4 / 3',
                      background: 'var(--bg-elevated)',
                      borderBottom: '1px solid var(--border)',
                      display: 'grid',
                      placeItems: 'center',
                      color: 'var(--text-muted)',
                      fontSize: '12px',
                      textAlign: 'center',
                    }}
                  >
                    {visibleImageSrc ? (
                      <Image
                        src={visibleImageSrc}
                        alt={vialCase.name}
                        fill
                        sizes="(max-width: 760px) 100vw, 300px"
                        unoptimized
                        onError={() => markImageFailed(visibleImageSrc)}
                        style={{ objectFit: 'contain', padding: '12px' }}
                      />
                    ) : (
                      'No image'
                    )}
                    {caseReorderMode ? (
                      <div
                        className="case-rank-pill"
                        data-selected={reorderSelected}
                        style={{ position: 'absolute', left: '12px', top: '12px' }}
                      >
                        {reorderSelected ? `#${reorderIndex + 1}` : `Next #${nextPickNumber}`}
                      </div>
                    ) : null}
                  </div>

                  <div style={{ display: 'grid', gap: '12px', minWidth: 0, padding: '14px' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <strong>{vialCase.name}</strong>
                      <span className="section-label">{vialCase.priceLabel}</span>
                      {!vialCase.publicVisible ? <span className="section-label">Hidden</span> : null}
                    </div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '13px', lineHeight: 1.6 }}>
                      {vialCase.description || 'No description yet.'}
                    </div>

                    {gallery.length > 0 && !caseReorderMode ? (
                      <div style={{ display: 'grid', gap: '8px' }}>
                        <div className="section-label">Images</div>
                        <div style={{ display: 'grid', gap: '8px' }}>
                          {gallery.map((image, index) => {
                            const thumbSrc = withVersion(image.url, vialCase.updatedAt)
                            const visibleThumbSrc = failedImageUrls.has(thumbSrc) ? '' : thumbSrc
                            return (
                            <div
                              key={image.id}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '52px minmax(0, 1fr)',
                                gap: '8px',
                                alignItems: 'center',
                                padding: '8px',
                                border: image.isPrimary ? '1px solid var(--accent-400)' : '1px solid var(--border)',
                                borderRadius: '8px',
                                background: image.isPrimary ? 'rgba(42, 79, 174, 0.08)' : 'var(--bg-elevated)',
                              }}
                            >
                              <div
                                style={{
                                  position: 'relative',
                                  width: '52px',
                                  height: '52px',
                                  background: 'var(--bg-card)',
                                  borderRadius: '6px',
                                  overflow: 'hidden',
                                }}
                              >
                                {visibleThumbSrc ? (
                                  <Image
                                    src={visibleThumbSrc}
                                    alt={image.label || vialCase.name}
                                    fill
                                    sizes="52px"
                                    unoptimized
                                    onError={() => markImageFailed(visibleThumbSrc)}
                                    style={{ objectFit: 'contain' }}
                                  />
                                ) : (
                                  <span style={{ color: 'var(--text-muted)', fontSize: '10px', padding: '6px' }}>Missing</span>
                                )}
                              </div>
                              <div style={{ display: 'grid', gap: '6px', minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                                  <span style={{ color: 'var(--text-secondary)', fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {image.isPrimary ? 'Primary image' : image.label || `Image ${index + 1}`}
                                  </span>
                                  <button
                                    type="button"
                                    className="fm-btn-outline"
                                    style={{ padding: '5px 8px', fontSize: '11px' }}
                                    onClick={() => void removeImage(vialCase.id, image.id)}
                                  >
                                    Remove
                                  </button>
                                </div>
                                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                                  {!image.isPrimary ? (
                                    <button
                                      type="button"
                                      className="fm-btn-outline"
                                      style={{ padding: '5px 8px', fontSize: '11px' }}
                                      onClick={() => void makePrimaryImage(vialCase, image.id)}
                                    >
                                      Make Primary
                                    </button>
                                  ) : null}
                                  <button
                                    type="button"
                                    className="fm-btn-outline"
                                    style={{ padding: '5px 8px', fontSize: '11px' }}
                                    onClick={() => void moveImage(vialCase, image.id, -1)}
                                    disabled={index === 0}
                                  >
                                    Up
                                  </button>
                                  <button
                                    type="button"
                                    className="fm-btn-outline"
                                    style={{ padding: '5px 8px', fontSize: '11px' }}
                                    onClick={() => void moveImage(vialCase, image.id, 1)}
                                    disabled={index === gallery.length - 1}
                                  >
                                    Down
                                  </button>
                                </div>
                              </div>
                            </div>
                          )})}
                        </div>
                      </div>
                    ) : null}

                    {caseReorderMode ? (
                      <button
                        type="button"
                        className="fm-btn-outline"
                        disabled={caseReorderSaving}
                        onClick={(event) => {
                          event.stopPropagation()
                          toggleCaseReorderPick(vialCase.id)
                        }}
                        style={{ padding: '8px 12px', fontSize: '12px', width: 'fit-content' }}
                      >
                        {reorderSelected ? 'Undo pick' : 'Pick next'}
                      </button>
                    ) : (
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'space-between', flexWrap: 'wrap', paddingTop: '4px' }}>
                        <label className="fm-btn-outline" style={{ padding: '8px 12px', fontSize: '12px', cursor: 'pointer' }}>
                          {uploadingId === vialCase.id ? 'Uploading...' : 'Add Image'}
                          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => openImageEditor(vialCase.id, vialCase.name, event)} style={{ display: 'none' }} />
                        </label>
                        {gallery.length > 0 ? (
                          <button type="button" className="fm-btn-outline" style={{ padding: '8px 12px', fontSize: '12px' }} onClick={() => void removeImage(vialCase.id)}>
                            Remove All Images
                          </button>
                        ) : null}
                        <button type="button" className="fm-btn-outline" style={{ padding: '8px 12px', fontSize: '12px' }} onClick={() => startEdit(vialCase)}>
                          Edit
                        </button>
                        <button type="button" className="fm-btn-outline" style={{ padding: '8px 12px', fontSize: '12px' }} onClick={() => void removeCase(vialCase.id)}>
                          Remove
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              )
            })}
            {!loading && activeCases.length === 0 ? (
              <div style={{ color: 'var(--text-secondary)', lineHeight: 1.7 }}>
                No active vial cases yet. Add the first case above after running the latest Supabase schema.
              </div>
            ) : null}
          </div>
        </div>

        {archivedCases.length > 0 ? (
          <div className="card" style={{ padding: '20px', display: 'grid', gap: '10px' }}>
            <div className="section-label">Removed Cases</div>
            {archivedCases.map((vialCase) => (
              <div key={vialCase.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', color: 'var(--text-secondary)', borderTop: '1px solid var(--border)', paddingTop: '10px' }}>
                <span>{vialCase.name}</span>
                <button type="button" className="fm-btn-outline" style={{ padding: '6px 10px', fontSize: '12px' }} onClick={() => startEdit(vialCase)}>
                  Restore/Edit
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </AdminShell>
  )
}
