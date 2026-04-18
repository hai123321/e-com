'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Upload } from 'lucide-react'
import { adminApi } from '@/lib/admin-api'
import { CropModal } from '@/components/ui/CropModal'

interface Group {
  groupKey: string
  name: string
  image: string
}

export function GroupImagesTab() {
  const [groups, setGroups]       = useState<Group[]>([])
  const [loading, setLoading]     = useState(true)
  const [cropSrc, setCropSrc]     = useState<string | null>(null)
  const [cropGroupKey, setCropGroupKey] = useState('')
  const [saving, setSaving]       = useState(false)
  const fileInputRef              = useRef<HTMLInputElement>(null)
  const pendingGroupKey           = useRef('')

  useEffect(() => {
    adminApi.getProducts().then((r) => {
      const products: { groupKey: string; name: string; image: string }[] = r.data ?? []
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
    e.target.value = ''
  }

  const handleConfirm = async (dataUrl: string) => {
    setSaving(true)
    try {
      const token = localStorage.getItem('admin_token') ?? ''
      const res = await fetch('/api/upload-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ groupKey: cropGroupKey, imageData: dataUrl }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error ?? 'Upload thất bại')
      setGroups(gs =>
        gs.map(g => g.groupKey === cropGroupKey ? { ...g, image: json.data.path + '?t=' + Date.now() } : g)
      )
      setCropSrc(null)
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Lỗi upload')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="text-gray-500 text-sm">Đang tải...</p>

  return (
    <>
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

      <p className="text-gray-500 text-xs mb-4">
        {groups.length} nhóm · Ảnh lưu vào <code className="text-gray-400">/api/logos/&#123;groupKey&#125;.jpg</code> · 400×400 JPEG
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {groups.map((g) => (
          <div key={g.groupKey} className="bg-gray-800/60 border border-gray-700 rounded-xl overflow-hidden group">
            <div className="aspect-square bg-gray-900 relative">
              {g.image ? (
                <Image src={g.image} alt={g.groupKey} fill className="object-contain p-2" sizes="160px" unoptimized />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-gray-700 text-3xl font-bold">
                  {g.groupKey.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
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
          title={`Cắt ảnh — ${cropGroupKey}`}
          onConfirm={handleConfirm}
          onClose={() => setCropSrc(null)}
        />
      )}

      {saving && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-gray-900 rounded-2xl px-8 py-6 text-white text-sm font-semibold">
            Đang lưu ảnh...
          </div>
        </div>
      )}
    </>
  )
}
