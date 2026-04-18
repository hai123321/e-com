'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Check, X } from 'lucide-react'

const CONTAINER = 360   // display box px
const HANDLE    = 14    // corner handle size px
const MIN_W     = 60    // minimum frame width px

type DragMode = 'move' | 'tl' | 'tr' | 'bl' | 'br'

interface Frame { x: number; y: number; w: number; h: number }
interface Rect  { x: number; y: number; w: number; h: number }

interface Props {
  src: string
  title?: string
  /** Output canvas width px (default 400) */
  outputWidth?: number
  /** Output canvas height px (default same as outputWidth → square) */
  outputHeight?: number
  /** Aspect ratio w/h (default 1 = square). Use e.g. 3 for a 3:1 banner */
  aspectRatio?: number
  /** Called with base64 JPEG data-URL on confirm */
  onConfirm: (dataUrl: string) => void
  onClose: () => void
}

export function CropModal({
  src,
  title,
  outputWidth = 400,
  outputHeight,
  aspectRatio = 1,
  onConfirm,
  onClose,
}: Props) {
  const outW = outputWidth
  const outH = outputHeight ?? Math.round(outputWidth / aspectRatio)

  // Container width is fixed; height scales to keep aspect ratio visible
  const containerW = CONTAINER
  const containerH = Math.round(CONTAINER / aspectRatio)

  const imgRef       = useRef<HTMLImageElement>(null)
  const [natural, setNatural] = useState({ w: 1, h: 1 })
  const [frame, setFrame]     = useState<Frame>({ x: 0, y: 0, w: containerW * 0.8, h: containerH * 0.8 })
  const dragRef = useRef<{ mode: DragMode; mx0: number; my0: number; f0: Frame } | null>(null)

  // Compute image display rect inside container (object-contain logic)
  const imgRect = useCallback((): Rect => {
    const scale = Math.min(containerW / natural.w, containerH / natural.h)
    const w = natural.w * scale
    const h = natural.h * scale
    return { x: (containerW - w) / 2, y: (containerH - h) / 2, w, h }
  }, [natural, containerW, containerH])

  // Clamp frame inside image display rect, enforcing aspect ratio
  const clampFrame = useCallback((f: Frame, rect: Rect): Frame => {
    const maxW  = rect.w
    const maxH  = rect.h
    // Fit within both axes while keeping aspect ratio
    let w = Math.max(MIN_W, Math.min(f.w, maxW))
    let h = w / aspectRatio
    if (h > maxH) { h = maxH; w = h * aspectRatio }
    const x = Math.max(rect.x, Math.min(f.x, rect.x + rect.w - w))
    const y = Math.max(rect.y, Math.min(f.y, rect.y + rect.h - h))
    return { x, y, w, h }
  }, [aspectRatio])

  // Re-center frame when image loads
  useEffect(() => {
    if (natural.w === 1) return
    const r  = imgRect()
    let w    = r.w * 0.9
    let h    = w / aspectRatio
    if (h > r.h * 0.9) { h = r.h * 0.9; w = h * aspectRatio }
    setFrame({ x: r.x + (r.w - w) / 2, y: r.y + (r.h - h) / 2, w, h })
  }, [natural, imgRect, aspectRatio])

  // ── Drag ─────────────────────────────────────────────────────────────────
  const startDrag = (mode: DragMode, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation()
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
      const x2 = f0.x + f0.w
      const y2 = f0.y + f0.h

      if (d.mode === 'br') {
        const wByX = f0.w + dx
        const wByY = (f0.h + dy) * aspectRatio
        const w    = Math.max(MIN_W, Math.min(wByX, wByY))
        next = { x: f0.x, y: f0.y, w, h: w / aspectRatio }
      } else if (d.mode === 'bl') {
        const wByX = f0.w - dx
        const wByY = (f0.h + dy) * aspectRatio
        const w    = Math.max(MIN_W, Math.min(wByX, wByY))
        next = { x: x2 - w, y: f0.y, w, h: w / aspectRatio }
      } else if (d.mode === 'tr') {
        const wByX = f0.w + dx
        const wByY = (f0.h - dy) * aspectRatio
        const w    = Math.max(MIN_W, Math.min(wByX, wByY))
        next = { x: f0.x, y: y2 - w / aspectRatio, w, h: w / aspectRatio }
      } else { // tl
        const wByX = f0.w - dx
        const wByY = (f0.h - dy) * aspectRatio
        const w    = Math.max(MIN_W, Math.min(wByX, wByY))
        next = { x: x2 - w, y: y2 - w / aspectRatio, w, h: w / aspectRatio }
      }
    }
    setFrame(clampFrame(next, rect))
  }, [imgRect, clampFrame, aspectRatio])

  const stopDrag = useCallback(() => { dragRef.current = null }, [])

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', stopDrag)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', stopDrag)
    }
  }, [onMouseMove, stopDrag])

  // ── Touch ─────────────────────────────────────────────────────────────────
  const startTouch = (mode: DragMode, e: React.TouchEvent) => {
    e.stopPropagation()
    const t = e.touches[0]
    dragRef.current = { mode, mx0: t.clientX, my0: t.clientY, f0: { ...frame } }
  }

  const onTouchMove = useCallback((e: TouchEvent) => {
    const d = dragRef.current
    if (!d) return
    const t = e.touches[0]
    onMouseMove({ clientX: t.clientX, clientY: t.clientY } as MouseEvent)
  }, [onMouseMove])

  useEffect(() => {
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', stopDrag)
    return () => {
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', stopDrag)
    }
  }, [onTouchMove, stopDrag])

  // ── Confirm ───────────────────────────────────────────────────────────────
  const handleConfirm = () => {
    const img = imgRef.current
    if (!img) return
    const r      = imgRect()
    const scaleX = r.w / natural.w
    const scaleY = r.h / natural.h
    const natX   = (frame.x - r.x) / scaleX
    const natY   = (frame.y - r.y) / scaleY
    const natW   = frame.w / scaleX
    const natH   = frame.h / scaleY

    const canvas = document.createElement('canvas')
    canvas.width  = outW
    canvas.height = outH
    canvas.getContext('2d')!.drawImage(img, natX, natY, natW, natH, 0, 0, outW, outH)
    onConfirm(canvas.toDataURL('image/jpeg', 0.90))
  }

  const { x, y, w, h } = frame

  return (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl w-full max-w-xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="text-white font-semibold text-sm">{title ?? 'Cắt ảnh'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Crop canvas */}
          <div className="flex justify-center select-none">
            <div
              className="relative overflow-hidden rounded-xl bg-black"
              style={{ width: containerW, height: containerH }}
            >
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
                  position: 'absolute',
                  left: imgRect().x,
                  top:  imgRect().y,
                  width:  imgRect().w,
                  height: imgRect().h,
                  userSelect: 'none',
                  pointerEvents: 'none',
                }}
              />

              {/* Dim overlay — 4 sides */}
              <div className="absolute bg-black/60 pointer-events-none" style={{ left: 0, top: 0, width: containerW, height: y }} />
              <div className="absolute bg-black/60 pointer-events-none" style={{ left: 0, top: y + h, width: containerW, height: containerH - y - h }} />
              <div className="absolute bg-black/60 pointer-events-none" style={{ left: 0, top: y, width: x, height: h }} />
              <div className="absolute bg-black/60 pointer-events-none" style={{ left: x + w, top: y, width: containerW - x - w, height: h }} />

              {/* Crop frame */}
              <div
                className="absolute border-2 border-white cursor-move"
                style={{ left: x, top: y, width: w, height: h }}
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
                const isLeft = corner.includes('l')
                const isTop  = corner.startsWith('t')
                const cursor = corner === 'tl' || corner === 'br' ? 'nwse-resize' : 'nesw-resize'
                return (
                  <div
                    key={corner}
                    className="absolute bg-white rounded-sm z-10"
                    style={{
                      width:  HANDLE,
                      height: HANDLE,
                      left:   isLeft ? x - HANDLE / 2 : x + w - HANDLE / 2,
                      top:    isTop  ? y - HANDLE / 2 : y + h - HANDLE / 2,
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
            Kéo frame để di chuyển · Kéo góc để thay đổi kích thước · Lưu ra {outW}×{outH} JPEG
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
