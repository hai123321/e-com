'use client'
import { useState, useEffect, useMemo } from 'react'
import { adminApi } from '@/lib/admin-api'
import { formatCurrency } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────────────────────────
interface RevenueDay   { day: string; revenue: number; orders: number }
interface ProductSold  { name: string; soldCount: number; price: number }
interface ProductRev   { name: string; revenue: number; units: number }
interface TopBuyer     { name: string; email: string; orders: number; spend: number }
interface Summary {
  total_revenue: number; avg_order_value: number
  delivered_orders: number; pending_orders: number; confirmed_orders: number; cancelled_orders: number
}

interface Analytics {
  revenueByDay:         RevenueDay[]
  topProductsBySold:    ProductSold[]
  topProductsByRevenue: ProductRev[]
  topBuyers:            TopBuyer[]
  summary:              Summary
}

// ── Reusable Components ───────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-5">
      <p className="text-gray-400 text-xs font-medium uppercase tracking-wider mb-1">{label}</p>
      <p className="text-white text-2xl font-extrabold">{value}</p>
      {sub && <p className="text-gray-500 text-xs mt-1">{sub}</p>}
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
      {children}
    </h3>
  )
}

// Horizontal bar chart row
function BarRow({
  rank, label, sub, value, max, formattedValue, color,
}: {
  rank: number; label: string; sub?: string; value: number; max: number
  formattedValue: string; color: string
}) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-3 group">
      <span className="text-gray-600 text-xs w-5 text-right shrink-0">{rank}</span>
      <div className="w-36 min-w-0 shrink-0">
        <p className="text-gray-200 text-xs font-medium truncate">{label}</p>
        {sub && <p className="text-gray-500 text-xs truncate">{sub}</p>}
      </div>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-gray-300 text-xs font-semibold w-24 text-right shrink-0">
        {formattedValue}
      </span>
    </div>
  )
}

// SVG sparkline / area chart for revenue over time
function RevenueChart({ data }: { data: RevenueDay[] }) {
  const W = 600; const H = 160; const PAD = { t: 10, r: 16, b: 32, l: 56 }
  const iW = W - PAD.l - PAD.r
  const iH = H - PAD.t - PAD.b

  const maxRev = Math.max(...data.map(d => d.revenue), 1)

  const pts = data.map((d, i) => ({
    x: PAD.l + (i / Math.max(data.length - 1, 1)) * iW,
    y: PAD.t + iH - (d.revenue / maxRev) * iH,
    d,
  }))

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
  const areaPath = pts.length
    ? `${linePath} L ${pts[pts.length - 1].x.toFixed(1)} ${(PAD.t + iH).toFixed(1)} L ${PAD.l.toFixed(1)} ${(PAD.t + iH).toFixed(1)} Z`
    : ''

  // Y-axis labels (3 ticks)
  const ticks = [0, 0.5, 1].map(f => ({
    y: PAD.t + iH - f * iH,
    label: formatCurrency(f * maxRev),
  }))

  // X-axis: show every nth label to avoid crowding
  const step = Math.ceil(data.length / 7)
  const xLabels = data.filter((_, i) => i % step === 0 || i === data.length - 1)

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
        Chưa có dữ liệu doanh thu
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ minWidth: 300 }}>
        <defs>
          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PAD.l} y1={t.y} x2={W - PAD.r} y2={t.y}
              stroke="#374151" strokeWidth="1" strokeDasharray="4 4" />
            <text x={PAD.l - 8} y={t.y + 4} textAnchor="end" fill="#6b7280" fontSize="10">
              {t.label}
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="url(#revGrad)" />

        {/* Line */}
        <path d={linePath} fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {/* Data points */}
        {pts.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="3" fill="#7c3aed" stroke="#1f2937" strokeWidth="1.5">
            <title>{p.d.day}: {formatCurrency(p.d.revenue)} ({p.d.orders} đơn)</title>
          </circle>
        ))}

        {/* X labels */}
        {xLabels.map((d, i) => {
          const idx = data.indexOf(d)
          const x = PAD.l + (idx / Math.max(data.length - 1, 1)) * iW
          return (
            <text key={i} x={x} y={H - 4} textAnchor="middle" fill="#6b7280" fontSize="9">
              {d.day.slice(5)} {/* MM-DD */}
            </text>
          )
        })}
      </svg>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export function AnalyticsTab() {
  const [days, setDays]     = useState(30)
  const [data, setData]     = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    adminApi.getAnalytics(days)
      .then(r => setData(r.data))
      .finally(() => setLoading(false))
  }, [days])

  const maxSold    = useMemo(() => Math.max(...(data?.topProductsBySold.map(p => p.soldCount) ?? [1])), [data])
  const maxRevProd = useMemo(() => Math.max(...(data?.topProductsByRevenue.map(p => p.revenue) ?? [1])), [data])
  const maxSpend   = useMemo(() => Math.max(...(data?.topBuyers.map(b => b.spend) ?? [1])), [data])

  const RANGE_BTNS = [
    { label: '7 ngày',  value: 7 },
    { label: '30 ngày', value: 30 },
    { label: '90 ngày', value: 90 },
  ]

  return (
    <div className="space-y-8">

      {/* Range selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-white font-bold text-base">Thống kê & phân tích</h2>
        <div className="flex gap-1 bg-gray-800 rounded-xl p-1">
          {RANGE_BTNS.map(b => (
            <button
              key={b.value}
              onClick={() => setDays(b.value)}
              className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                days === b.value
                  ? 'bg-primary-700 text-white'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center h-48 text-gray-500 text-sm">
          <div className="w-5 h-5 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mr-2" />
          Đang tải dữ liệu...
        </div>
      )}

      {!loading && data && (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Doanh thu hoàn thành"
              value={formatCurrency(data.summary.total_revenue ?? 0)}
              sub={`${days} ngày qua`}
            />
            <StatCard
              label="Đơn hoàn thành"
              value={String(data.summary.delivered_orders ?? 0)}
              sub={`Giá trị TB: ${formatCurrency(data.summary.avg_order_value ?? 0)}`}
            />
            <StatCard
              label="Tổng SP bán ra"
              value={String(data.topProductsBySold.reduce((s, p) => s + p.soldCount, 0))}
              sub="từ trước đến nay"
            />
            <div className="bg-gray-800/60 border border-gray-700 rounded-2xl p-5 space-y-2">
              <p className="text-gray-400 text-xs font-medium uppercase tracking-wider">Trạng thái đơn ({days}d)</p>
              <div className="space-y-1.5">
                {[
                  { label: 'Chờ xử lý',  count: data.summary.pending_orders   ?? 0, color: 'text-yellow-400' },
                  { label: 'Đã xác nhận', count: data.summary.confirmed_orders ?? 0, color: 'text-blue-400'   },
                  { label: 'Hoàn thành',  count: data.summary.delivered_orders ?? 0, color: 'text-green-400'  },
                  { label: 'Đã huỷ',      count: data.summary.cancelled_orders ?? 0, color: 'text-red-400'    },
                ].map(({ label, count, color }) => (
                  <div key={label} className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">{label}</span>
                    <span className={`font-bold ${color}`}>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Revenue chart */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <SectionTitle>📈 Doanh thu theo ngày</SectionTitle>
            <RevenueChart data={data.revenueByDay} />
            {data.revenueByDay.length > 0 && (
              <p className="text-gray-600 text-xs mt-2 text-right">
                Tổng: {data.revenueByDay.length} ngày có đơn hoàn thành
              </p>
            )}
          </div>

          {/* Two-column: best-selling + most profitable */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

            {/* Top products by sold count */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <SectionTitle>🏆 Sản phẩm bán chạy nhất</SectionTitle>
              {data.topProductsBySold.length === 0
                ? <p className="text-gray-600 text-sm">Chưa có dữ liệu</p>
                : (
                  <div className="space-y-3">
                    {data.topProductsBySold.map((p, i) => (
                      <BarRow
                        key={i}
                        rank={i + 1}
                        label={p.name}
                        sub={`${formatCurrency(p.price)} / đơn vị`}
                        value={p.soldCount}
                        max={maxSold}
                        formattedValue={`${p.soldCount.toLocaleString('vi-VN')} đã bán`}
                        color="bg-primary-600"
                      />
                    ))}
                  </div>
                )}
            </div>

            {/* Top products by revenue */}
            <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
              <SectionTitle>💰 Sản phẩm doanh thu cao nhất</SectionTitle>
              {data.topProductsByRevenue.length === 0
                ? <p className="text-gray-600 text-sm">Chưa có dữ liệu</p>
                : (
                  <div className="space-y-3">
                    {data.topProductsByRevenue.map((p, i) => (
                      <BarRow
                        key={i}
                        rank={i + 1}
                        label={p.name}
                        sub={`${p.units.toLocaleString('vi-VN')} đơn vị đã giao`}
                        value={p.revenue}
                        max={maxRevProd}
                        formattedValue={formatCurrency(p.revenue)}
                        color="bg-emerald-600"
                      />
                    ))}
                  </div>
                )}
            </div>
          </div>

          {/* Top buyers */}
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <SectionTitle>👑 Khách hàng chi tiêu nhiều nhất</SectionTitle>
            {data.topBuyers.length === 0
              ? <p className="text-gray-600 text-sm">Chưa có dữ liệu</p>
              : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                  {data.topBuyers.map((b, i) => (
                    <BarRow
                      key={i}
                      rank={i + 1}
                      label={b.name}
                      sub={b.email ?? '—'}
                      value={b.spend}
                      max={maxSpend}
                      formattedValue={`${formatCurrency(b.spend)} · ${b.orders} đơn`}
                      color="bg-amber-600"
                    />
                  ))}
                </div>
              )}
          </div>
        </>
      )}
    </div>
  )
}
