'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Copy, Check, Users, Gift, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { useStore } from '@/lib/store'
import { fetchReferralCode, fetchReferralStats, type ReferralStats } from '@/lib/auth'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://miushop.io.vn'

function formatMoney(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n)
}

export default function ReferralPage() {
  const router = useRouter()
  const { user, userToken, sessionHydrated } = useStore()

  const [code, setCode] = useState<string | null>(null)
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!sessionHydrated) return
    if (!user) { router.replace('/dang-nhap'); return }
  }, [sessionHydrated, user, router])

  useEffect(() => {
    if (!userToken) return
    setLoading(true)
    Promise.all([
      fetchReferralCode(userToken),
      fetchReferralStats(userToken),
    ]).then(([c, s]) => {
      setCode(c)
      setStats(s)
    }).finally(() => setLoading(false))
  }, [userToken])

  const referralLink = code ? `${SITE_URL}?ref=${code}` : ''

  const handleCopy = async () => {
    if (!referralLink) return
    await navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!sessionHydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-primary-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary-800 to-primary-600 text-white py-10">
        <div className="section-container">
          <Link
            href="/tai-khoan"
            className="flex items-center gap-2 text-white/70 hover:text-white text-sm mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Tài khoản
          </Link>
          <h1 className="text-2xl font-extrabold">Chương trình giới thiệu</h1>
          <p className="text-white/70 text-sm mt-1">
            Giới thiệu bạn bè u2014 nhận {formatMoney(20000)} cho mỗi người mua hàng lần đầu
          </p>
        </div>
      </div>

      <div className="section-container py-8 max-w-2xl">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="card p-6 text-center">
                <Users className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                <p className="text-3xl font-extrabold text-gray-900">{stats?.referralCount ?? 0}</p>
                <p className="text-sm text-gray-500 mt-1">Người đã giới thiệu</p>
              </div>
              <div className="card p-6 text-center">
                <Gift className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <p className="text-3xl font-extrabold text-gray-900">{formatMoney(stats?.totalCredit ?? 0)}</p>
                <p className="text-sm text-gray-500 mt-1">Tổng credit nhận được</p>
              </div>
            </div>

            {/* Referral link */}
            <div className="card p-6">
              <h2 className="font-bold text-gray-900 mb-1">Link giới thiệu của bạn</h2>
              <p className="text-sm text-gray-500 mb-4">
                Chia sẻ link này với bạn bè. Khi họ mua hàng lần đầu, bạn nhận ngay {formatMoney(20000)} credit.
              </p>

              {code ? (
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono text-gray-700 truncate">
                    {referralLink}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 bg-primary-700 hover:bg-primary-800 text-white text-sm font-semibold px-4 py-3 rounded-xl transition-colors shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    {copied ? 'Đã chép!' : 'Sao chép'}
                  </button>
                </div>
              ) : (
                <p className="text-sm text-red-500">Không thể tải link. Vui lòng thử lại sau.</p>
              )}

              <div className="mt-4 p-3 bg-primary-50 border border-primary-100 rounded-xl">
                <p className="text-sm font-semibold text-primary-800 mb-1">Mã giới thiệu: <span className="font-mono">{code ?? '—'}</span></p>
              </div>
            </div>

            {/* How it works */}
            <div className="card p-6 mt-4">
              <h2 className="font-bold text-gray-900 mb-4">Cách hoạt động</h2>
              <ol className="space-y-3">
                {[
                  { n: 1, text: 'Sao chép link giới thiệu và chia sẻ với bạn bè.' },
                  { n: 2, text: 'Bạn bè truy cập Miu Shop qua link của bạn.' },
                  { n: 3, text: 'Khi họ hoàn thành đơn hàng đầu tiên, bạn nhận 20,000₫ credit.' },
                  { n: 4, text: 'Credit có thể dùng để giảm giá cho đơn hàng tiếp theo.' },
                ].map(({ n, text }) => (
                  <li key={n} className="flex items-start gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {n}
                    </span>
                    <span className="text-sm text-gray-600">{text}</span>
                  </li>
                ))}
              </ol>
            </div>
          </>
        )}
      </div>
    </main>
  )
}
