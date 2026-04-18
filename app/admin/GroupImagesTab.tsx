'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import { Upload, X, Check, ZoomIn, ZoomOut } from 'lucide-react'
import { adminApi } from '@/lib/admin-api'

interface Group {
  groupKey: string
  name: string
  image: string
}

const CROP_SIZE = 280 // square crop area px

// ─── Crop Modal ──────────────────────────────────────────────────────────────
function CropModal({
  src,
  groupKey,
  onSave,
  onClose,
}: {
  src: string
  groupKey: string
  onSave: (path: string) => void
  onClose: () => void
}) {
  const [zoom, setZoom] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, ox: 0, oy: 0 })
  const [naturalSize, setNaturalSize] = useState({ w: 1, h: 1 })
  const [saving, setSaving] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  // Base scale: fit image inside CROP_SIZE box
  const baseScale = Math.max(CROP_SIZE / naturalSize.w, CROP_SIZE / naturalSize.h)
  const scale = baseScale * zoom

  // Display dimensions
  const dw = naturalSize.w * scale
  const dh = naturalSize.h * scale

  // Clamp offset so image always covers the crop area
  const clamp = useCallback((ox: number, oy: number) => ({
    x: Math.min(0, Math.max(ox, CROP_SIZE - dw)),
    y: Math.min(0, Math.max(oy, CROP_SIZE - dh)),
  }), [dw, dh])

  // When zoom changes, re-clamp
  useEffect(() => {
    setOffset((o) => clamp(o.x, o.y))
  }, [zoom, clamp])

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setDragging(true)
    setDragStart({ mx: e.clientX, my: e.clientY, ox: offset.x, oy: offset.y })
  }
  const onMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return
    const dx = e.clientX - dragStart.mx
    const dy = e.clientY - dragStart.my
    setOffset(clamp(dragStart.ox + dx, dragStart.oy + dy))
  }
  const onMouseUp = () => setDragging(false)

  const handleSave = async () => {
    const img = imgRef.current
    if (!img) return
    setSaving(true)

    // Crop in natural image coords
    const cropNatX = (-offset.x) / scale
    const cropNatY = (-offset.y) / scale
    const cropNatSize = CROP_SIZE / scale

    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 400
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, cropNatX, cropNatY, cropNatSize, cropNatSize, 0, 0, 400, 400)

    const imageData = canvas.toDataURL('image/jpeg', 0.82)
    try {
      const token = localStorage.getItem('admin_token') ?? ''
      const res = await fetch('/api/upload-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ groupKey, imageData }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload thất bại')
      onSave(json.data.path)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi upload')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">Cắt ảnh — {groupKey}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button>
        </div>

        <div className="p-5 space-y-4">
          {/* Crop area */}
          <div className="flex justify-center">
            <div
              className="relative overflow-hidden rounded-xl border-2 border-primary-500 cursor-grab active:cursor-grabbing select-none"
              style={{ width: CROP_SIZE, height: CROP_SIZE }}
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseUp}
            >
              {/* Crosshair guide */}
              <div className="absolute inset-0 pointer-events-none z-10">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/20" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/20" />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={src}
                alt="crop"
                onLoad={(e) => {
                  const img = e.currentTarget
                  setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight })
                }}
                draggable={false}
                style={{
                  position: 'absolute',
                  width: dw,
                  height: dh,
                  left: offset.x,
                  top: offset.y,
                  userSelect: 'none',
                }}
              />
            </div>
          </div>

          {/* Zoom slider */}
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-gray-500 shrink-0" />
            <input
              type="range"
              min={1}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="flex-1 accent-primary-500"
            />
            <ZoomIn className="w-4 h-4 text-gray-500 shrink-0" />
            <span className="text-gray-500 text-xs w-10 text-right">{zoom.toFixed(1)}×</span>
          </div>
          <p className="text-gray-600 text-xs text-center">
            Kéo để căn chỉnh · Zoom để thu phóng · Lưu ra file 400×400 JPEG
          </p>

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-600 disabled:opacity-50 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Đang lưu...' : 'Lưu ảnh'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium transition-colors"
            >
              Hủy
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Group Images Tab ────────────────────────────────────────────────────────
export function GroupImagesTab() {
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(true)
  const [cropSrc, setCropSrc] = useState<string | null>(null)
  const [cropGroupKey, setCropGroupKey] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const pendingGroupKey = useRef('')

  useEffect(() => {
    adminApi.getProducts().then((r) => {
      const products: { groupKey: string; name: string; image: string }[] = r.data ?? []
      // Deduplicate by groupKey, keep first product's info
      const seen = new Set<string>()
      const deduped: Group[] = []
      for (const p of products) {
        if (p.groupKey && !seen.has(p.groupKey)) {
          seen.add(p.groupKey)
          deduped.push({ groupKey: p.groupKey, name: p.name.split(' ')[0], image: p.image })
        }
      }
      setGroups(deduped.sort((a, b) => a.groupKey.localeCompare(b.groupKey)))
      setLoading(false)
    })
  }, [])

  const triggerUpload = (groupKey: string) => {
    pendingGroupKey.current = groupKey
    fileInputRef.current?.click()
  }

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setCropSrc(ev.target?.result as string)
      setCropGroupKey(pendingGroupKey.current)
    }
    reader.readAsDataURL(file)
    e.target.value = '' // reset so same file can be re-selected
  }

  const onSaved = (path: string) => {
    setGroups((gs) =>
      gs.map((g) => (g.groupKey === cropGroupKey ? { ...g, image: path + '?t=' + Date.now() } : g))
    )
    setCropSrc(null)
  }

  if (loading) return <p className="text-gray-500 text-sm">Đang tải...</p>

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

      <p className="text-gray-500 text-xs mb-4">
        {groups.length} nhóm · Ảnh được lưu vào <code className="text-gray-400">/logos/&#123;groupKey&#125;.jpg</code> · 400×400 JPEG
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {groups.map((g) => (
          <div
            key={g.groupKey}
            className="bg-gray-800/60 border border-gray-700 rounded-xl overflow-hidden group"
          >
            {/* Image preview */}
            <div className="aspect-square bg-gray-900 relative">
              {g.image ? (
                <Image
                  src={g.image}
                  alt={g.groupKey}
                  fill
                  className="object-contain p-2"
                  sizes="160px"
                  unoptimized
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-3xl font-bold">
                  {g.groupKey.charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            {/* Info + upload */}
            <div className="p-2.5">
              <p className="text-white text-xs font-mono truncate">{g.groupKey}</p>
              <button
                onClick={() => triggerUpload(g.groupKey)}
                className="mt-2 w-full flex items-center justify-center gap-1.5 bg-gray-700 hover:bg-primary-700 text-gray-300 hover:text-white text-xs font-medium rounded-lg py-1.5 transition-colors"
              >
                <Upload className="w-3 h-3" />
                Upload
              </button>
            </div>
          </div>
        ))}
      </div>

      {cropSrc && (
        <CropModal
          src={cropSrc}
          groupKey={cropGroupKey}
          onSave={onSaved}
          onClose={() => setCropSrc(null)}
        />
      )}
    </>
  )
}
