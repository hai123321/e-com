'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Check, X } from 'lucide-react'

const CONTAINER = 360   // px — display box
const HANDLE    = 14    // corner handle size px
const MIN_FRAME = 60    // minimum crop frame size px

type DragMode = 'move' | 'tl' | 'tr' | 'bl' | 'br'

interface Frame { x: number; y: number; size: number }
interface Rect  { x: number; y: number; w: number; h: number }

interface Props {
  src: string
  title?: string
  outputSize?: number           // canvas output px (default 400)
  /** Called with base64 JPEG data-URL on confirm */
  onConfirm: (dataUrl: string) => void
  onClose: () => void
}

export function CropModal({ src, title, outputSize = 400, onConfirm, onClose }: Props) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const imgRef        = useRef<HTMLImageElement>(null)
  const [natural, setNatural]   = useState({ w: 1, h: 1 })
  const [frame, setFrame]       = useState<Frame>({ x: 60, y: 60, size: 240 })
  const dragRef = useRef<{ mode: DragMode; mx0: number; my0: number; f0: Frame } | null>(null)

  // Compute where the image actually renders inside the container (object-contain logic)
  const imgRect = useCallback((): Rect => {
    const scale = Math.min(CONTAINER / natural.w, CONTAINER / natural.h)
    const w = natural.w * scale
    const h = natural.h * scale
    return { x: (CONTAINER - w) / 2, y: (CONTAINER - h) / 2, w, h }
  }, [natural])

  // Clamp frame so it stays inside the image display rect
  const clampFrame = useCallback((f: Frame, rect: Rect): Frame => {
    const maxSize = Math.min(rect.w, rect.h, CONTAINER)
    const size    = Math.max(MIN_FRAME, Math.min(f.size, maxSize))
    const x = Math.max(rect.x, Math.min(f.x, rect.x + rect.w - size))
    const y = Math.max(rect.y, Math.min(f.y, rect.y + rect.h - size))
    return { x, y, size }
  }, [])

  // Re-center frame when image loads
  useEffect(() => {
    if (natural.w === 1) return
    const r    = imgRect()
    const size = Math.round(Math.min(r.w, r.h) * 0.8)
    setFrame({ x: r.x + (r.w - size) / 2, y: r.y + (r.h - size) / 2, size })
  }, [natural, imgRect])

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const startDrag = (mode: DragMode, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    dragRef.current = { mode, mx0: e.clientX, my0: e.clientY, f0: { ...frame } }
  }

  const onMouseMove = useCallback((e: MouseEvent) => {
    const d = dragRef.current
    if (!d) return
    const rect = imgRect()
    const dx = e.clientX - d.mx0
    const dy = e.clientY - d.my0
    const { f0 } = d
    let next: Frame

    if (d.mode === 'move') {
      next = { ...f0, x: f0.x + dx, y: f0.y + dy }
    } else {
      // Resize: keep opposite corner fixed, move the dragged corner
      let { x, y, size } = f0
      const x2 = x + size   // right edge
      const y2 = y + size   // bottom edge

      if (d.mode === 'tl') {
        const newX = Math.min(x2 - MIN_FRAME, x + dx)
        const newY = Math.min(y2 - MIN_FRAME, y + dy)
        const newSize = Math.min(x2 - newX, y2 - newY) // keep square by taking minimum change
        // Use the dimension that changed less to keep square
        const sizeByX = x2 - (x + dx)
        const sizeByY = y2 - (y + dy)
        const s = Math.max(MIN_FRAME, Math.min(sizeByX, sizeByY))
        next = { x: x2 - s, y: y2 - s, size: s }
        void newX; void newY; void newSize
      } else if (d.mode === 'tr') {
        const sizeByX = size + dx
        const sizeByY = y2 - (y + dy)
        const s = Math.max(MIN_FRAME, Math.min(sizeByX, sizeByY))
        next = { x, y: y2 - s, size: s }
      } else if (d.mode === 'bl') {
        const sizeByX = x2 - (x + dx)
        const sizeByY = size + dy
        const s = Math.max(MIN_FRAME, Math.min(sizeByX, sizeByY))
        next = { x: x2 - s, y, size: s }
      } else { // br
        const sizeByX = size + dx
        const sizeByY = size + dy
        const s = Math.max(MIN_FRAME, Math.min(sizeByX, sizeByY))
        next = { x, y, size: s }
      }
    }
    setFrame(clampFrame(next, rect))
  }, [imgRect, clampFrame])

  const stopDrag = useCallback(() => { dragRef.current = null }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', stopDrag)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', stopDrag)
    }
  }, [onMouseMove, stopDrag])

  // ── Touch support ──────────────────────────────────────────────────────────
  const startTouch = (mode: DragMode, e: React.TouchEvent) => {
    e.stopPropagation()
    const t = e.touches[0]
    dragRef.current = { mode, mx0: t.clientX, my0: t.clientY, f0: { ...frame } }
  }

  const onTouchMove = useCallback((e: TouchEvent) => {
    const d = dragRef.current
    if (!d) return
    const t = e.touches[0]
    const synth = { clientX: t.clientX, clientY: t.clientY } as MouseEvent
    onMouseMove(synth)
  }, [onMouseMove])

  useEffect(() => {
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', stopDrag)
    return () => {
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', stopDrag)
    }
  }, [onTouchMove, stopDrag])

  // ── Confirm: draw canvas crop ──────────────────────────────────────────────
  const handleConfirm = () => {
    const img = imgRef.current
    if (!img) return
    const r     = imgRect()
    const scale = r.w / natural.w  // px per natural px
    const natX  = (frame.x - r.x) / scale
    const natY  = (frame.y - r.y) / scale
    const natSz = frame.size / scale

    const canvas = document.createElement('canvas')
    canvas.width  = outputSize
    canvas.height = outputSize
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, natX, natY, natSz, natSz, 0, 0, outputSize, outputSize)
    onConfirm(canvas.toDataURL('image/jpeg', 0.85))
  }

  const { x, y, size } = frame

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">{title ?? 'Cắt ảnh'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* ── Crop canvas ── */}
          <div className="flex justify-center select-none">
            <div
              ref={containerRef}
              className="relative overflow-hidden rounded-xl bg-black"
              style={{ width: CONTAINER, height: CONTAINER }}
            >
              {/* Image */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imgRef}
                src={src}
                alt="crop"
                draggable={false}
                onLoad={e => {
                  const img = e.currentTarget
                  setNatural({ w: img.naturalWidth, h: img.naturalHeight })
                }}
                style={{
                  position:   'absolute',
                  left:       imgRect().x,
                  top:        imgRect().y,
                  width:      imgRect().w,
                  height:     imgRect().h,
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />

              {/* Dim overlay — 4 sides */}
              {/* Top */}
              <div className="absolute bg-black/60 pointer-events-none" style={{ left: 0, top: 0, width: CONTAINER, height: y }} />
              {/* Bottom */}
              <div className="absolute bg-black/60 pointer-events-none" style={{ left: 0, top: y + size, width: CONTAINER, height: CONTAINER - y - size }} />
              {/* Left */}
              <div className="absolute bg-black/60 pointer-events-none" style={{ left: 0, top: y, width: x, height: size }} />
              {/* Right */}
              <div className="absolute bg-black/60 pointer-events-none" style={{ left: x + size, top: y, width: CONTAINER - x - size, height: size }} />

              {/* Crop frame border */}
              <div
                className="absolute border-2 border-white cursor-move"
                style={{ left: x, top: y, width: size, height: size }}
                onMouseDown={e => startDrag('move', e)}
                onTouchStart={e => startTouch('move', e)}
              >
                {/* Rule-of-thirds guides */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute top-1/3 left-0 right-0 h-px bg-white/25" />
                  <div className="absolute top-2/3 left-0 right-0 h-px bg-white/25" />
                  <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/25" />
                  <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/25" />
                </div>
              </div>

              {/* Corner handles */}
              {(['tl','tr','bl','br'] as DragMode[]).map(corner => {
                const isLeft   = corner.includes('l')
                const isTop    = corner.startsWith('t')
                const cursor   = corner === 'tl' || corner === 'br' ? 'nwse-resize' : 'nesw-resize'
                return (
                  <div
                    key={corner}
                    className="absolute bg-white rounded-sm z-10"
                    style={{
                      width:  HANDLE,
                      height: HANDLE,
                      left:   isLeft ? x - HANDLE / 2 : x + size - HANDLE / 2,
                      top:    isTop  ? y - HANDLE / 2 : y + size - HANDLE / 2,
                      cursor,
                    }}
                    onMouseDown={e => startDrag(corner, e)}
                    onTouchStart={e => startTouch(corner, e)}
                  />
                )
              })}
            </div>
          </div>

          <p className="text-gray-600 text-xs text-center">
            Kéo frame để di chuyển · Kéo góc để thay đổi kích thước · Lưu ra {outputSize}×{outputSize} JPEG
          </p>

          <div className="flex gap-3 pt-1">
            <button
              onClick={handleConfirm}
              className="flex-1 flex items-center justify-center gap-2 bg-primary-700 hover:bg-primary-600 text-white font-semibold rounded-xl py-2.5 text-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              Xác nhận cắt
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
