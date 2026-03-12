'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  createChart,
  LineSeries,
  CandlestickSeries,
  LineType,
  CrosshairMode,
} from 'lightweight-charts'
import type { UTCTimestamp } from 'lightweight-charts'
import { ArrowUpRight, ArrowDownRight, Pin, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/** Seeded pseudo-random 0..1 for deterministic OHLC from daily close. */
function seededRandom(seed: number): number {
  const x = Math.sin(seed * 9999) * 10000
  return x - Math.floor(x)
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatMarketCap(value: number) {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`
  if (value >= 1e3) return `$${(value / 1e3).toFixed(2)}K`
  return formatPrice(value)
}

function formatChartDate(recordedAt: string) {
  return new Date(recordedAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function unlocksAt(purchasedAt: string): Date {
  const d = new Date(purchasedAt)
  d.setHours(d.getHours() + 24)
  return d
}

function countdownToUnlock(purchasedAt: string): string {
  const end = unlocksAt(purchasedAt).getTime()
  const now = Date.now()
  if (now >= end) return 'Now'
  const d = Math.floor((end - now) / (24 * 60 * 60 * 1000))
  const h = Math.floor(((end - now) % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const m = Math.floor(((end - now) % (60 * 60 * 1000)) / (60 * 1000))
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

function isLotSellable(purchasedAt: string): boolean {
  const cutoff = new Date()
  cutoff.setHours(cutoff.getHours() - 24)
  return new Date(purchasedAt).getTime() <= cutoff.getTime()
}

type CompanyData = {
  id: string
  name: string
  ticker: string
  sector: string
  description: string
  current_price: number
  shares_outstanding: number
  shares_available: number
  market_cap: number
  change_24h_pct: number | null
}

type PricePoint = { price: number; recorded_at: string; dateLabel: string }

type PriceAlertItem = {
  id: string
  target_price: number
  direction: string
  is_triggered: boolean
  created_at: string
}

type HoldingLotItem = {
  id: string
  remaining_quantity: number
  buy_price: number
  purchased_at: string
}

type StockDetailProps = {
  company: CompanyData
  priceHistory: Array<{ price: number; recorded_at: string }>
  holding: { quantity: number; avg_buy_price: number } | null
  holdingLots: HoldingLotItem[]
  sellableQuantity: number
  lockedQuantity: number
  recentOrders: Array<{
    id: string
    side: string
    quantity: number
    price: number
    created_at: string
    executed_at: string | null
  }>
  relatedNews: Array<{
    id: string
    title: string
    body: string
    is_pinned: boolean
    created_at: string
  }>
  cashBalance: number
  priceAlerts: PriceAlertItem[]
}

export function StockDetail({
  company,
  priceHistory,
  holding,
  holdingLots,
  sellableQuantity,
  lockedQuantity,
  recentOrders,
  relatedNews,
  cashBalance,
  priceAlerts: initialPriceAlerts,
}: StockDetailProps) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy')
  const [quantity, setQuantity] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [chartRange, setChartRange] = useState<'7D' | '30D' | 'All'>('30D')
  const [chartMode, setChartMode] = useState<'Line' | 'Candlestick'>('Line')
  const [expandedNewsId, setExpandedNewsId] = useState<string | null>(null)
  const chartContainerRef = useRef<HTMLDivElement>(null)
  const chartInstanceRef = useRef<ReturnType<typeof createChart> | null>(null)
  const [priceAlerts, setPriceAlerts] = useState<PriceAlertItem[]>(initialPriceAlerts)
  const [alertDirection, setAlertDirection] = useState<'above' | 'below'>('above')
  const [alertTargetPrice, setAlertTargetPrice] = useState('')
  const [alertSubmitting, setAlertSubmitting] = useState(false)
  const [currentPrice, setCurrentPrice] = useState(company.current_price)
  const chartSeriesRef = useRef<{ update: (data: unknown) => void } | null>(null)
  const chartModeRef = useRef(chartMode)

  useEffect(() => {
    setCurrentPrice(company.current_price)
  }, [company.id, company.current_price])

  useEffect(() => {
    chartModeRef.current = chartMode
  }, [chartMode])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`company-price-${company.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'companies',
          filter: `id=eq.${company.id}`,
        },
        (payload) => {
          const newPrice = (payload.new as { current_price?: number })?.current_price
          if (typeof newPrice === 'number') {
            setCurrentPrice(newPrice)
            const series = chartSeriesRef.current
            if (series) {
              const time = Math.floor(Date.now() / 1000) as UTCTimestamp
              if (chartModeRef.current === 'Line') {
                series.update({ time, value: newPrice })
              } else {
                series.update({
                  time,
                  open: newPrice,
                  high: newPrice,
                  low: newPrice,
                  close: newPrice,
                })
              }
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [company.id])

  const chartData: PricePoint[] = useMemo(
    () =>
      priceHistory.map((p) => ({
        ...p,
        dateLabel: formatChartDate(p.recorded_at),
      })),
    [priceHistory]
  )

  const filteredChartData = useMemo(() => {
    if (chartRange === 'All') return chartData
    const days = chartRange === '7D' ? 7 : 30
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return chartData.filter((p) => new Date(p.recorded_at) >= cutoff)
  }, [chartData, chartRange])

  const lineChartData = useMemo(() => {
    return filteredChartData.map((p) => ({
      time: Math.floor(new Date(p.recorded_at).getTime() / 1000) as UTCTimestamp,
      value: p.price,
    }))
  }, [filteredChartData])

  const candlestickChartData = useMemo(() => {
    const out: Array<{ time: UTCTimestamp; open: number; high: number; low: number; close: number }> = []
    let prevClose: number | null = null
    for (let i = 0; i < filteredChartData.length; i++) {
      const p = filteredChartData[i]
      const close = p.price
      const open = prevClose ?? close * 0.998
      const seed1 = p.price * 1000 + i
      const seed2 = p.price * 1000 + i + 10000
      const highPct = 0.005 + seededRandom(seed1) * 0.01
      const lowPct = 0.005 + seededRandom(seed2) * 0.01
      out.push({
        time: Math.floor(new Date(p.recorded_at).getTime() / 1000) as UTCTimestamp,
        open,
        high: close * (1 + highPct),
        low: open * (1 - lowPct),
        close,
      })
      prevClose = close
    }
    return out
  }, [filteredChartData])

  useEffect(() => {
    const container = chartContainerRef.current
    if (!container) return

    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove()
      chartInstanceRef.current = null
    }

    const chart = createChart(container, {
      layout: {
        background: { color: '#111118' },
        textColor: '#ffffff',
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.1)' },
        horzLines: { color: 'rgba(255,255,255,0.1)' },
      },
      width: container.clientWidth,
      height: 350,
      autoSize: true,
      crosshair: { mode: CrosshairMode.Normal },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.2)',
        scaleMargins: { top: 0.1, bottom: 0.2 },
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.2)',
        timeVisible: true,
        secondsVisible: false,
      },
    })

    let series: { update: (data: unknown) => void }
    if (chartMode === 'Line') {
      series = chart.addSeries(LineSeries, {
        color: '#00ff88',
        lineType: LineType.Curved,
        lineWidth: 2,
      })
      series.setData(lineChartData)
    } else {
      series = chart.addSeries(CandlestickSeries, {
        upColor: '#00ff88',
        downColor: '#ff4444',
        borderUpColor: '#00ff88',
        borderDownColor: '#ff4444',
      })
      series.setData(candlestickChartData)
    }
    chartSeriesRef.current = series

    chart.timeScale().fitContent()
    chartInstanceRef.current = chart

    return () => {
      chart.remove()
      chartInstanceRef.current = null
      chartSeriesRef.current = null
    }
  }, [chartMode, lineChartData, candlestickChartData])

  const qtyNum = parseInt(quantity, 10) || 0
  const totalCost = qtyNum * currentPrice
  const canAffordBuy = totalCost > 0 && totalCost <= cashBalance
  const sharesOwned = holding?.quantity ?? 0
  const canSell =
    activeTab === 'sell' &&
    qtyNum > 0 &&
    sellableQuantity > 0 &&
    qtyNum <= sellableQuantity

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 4000)
  }

  const handleSetAlert = async () => {
    const price = parseFloat(alertTargetPrice)
    if (!Number.isFinite(price) || price <= 0) {
      showToast('error', 'Enter a valid target price')
      return
    }
    setAlertSubmitting(true)
    try {
      const res = await fetch('/api/price-alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: company.id,
          target_price: price,
          direction: alertDirection,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        showToast('error', data.error ?? 'Failed to set alert')
        return
      }
      setPriceAlerts((prev) => [
        {
          id: data.alert.id,
          target_price: data.alert.target_price,
          direction: data.alert.direction,
          is_triggered: data.alert.is_triggered,
          created_at: data.alert.created_at,
        },
        ...prev,
      ])
      setAlertTargetPrice('')
      showToast('success', 'Price alert set')
    } catch {
      showToast('error', 'Network error')
    } finally {
      setAlertSubmitting(false)
    }
  }

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const res = await fetch('/api/price-alerts', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: alertId }),
      })
      if (!res.ok) return
      setPriceAlerts((prev) => prev.filter((a) => a.id !== alertId))
    } catch {
      showToast('error', 'Failed to delete alert')
    }
  }

  const handleTrade = async () => {
    if (activeTab === 'buy' && !canAffordBuy) return
    if (activeTab === 'sell' && !canSell) return
    if (qtyNum <= 0) return

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: company.id,
          side: activeTab,
          quantity: qtyNum,
          order_type: 'market',
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        showToast('error', data.error ?? 'Trade failed')
        return
      }
      if (typeof data.new_price === 'number') {
        setCurrentPrice(data.new_price)
      }
      showToast('success', `${activeTab === 'buy' ? 'Buy' : 'Sell'} order placed`)
      setQuantity('')
      router.refresh()
    } catch {
      showToast('error', 'Network error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const CARD = 'rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md'

  return (
    <div className="space-y-6 pb-8">
      <AnimatePresence>
        {toast && (
          <motion.div
            key={toast.message}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`fixed right-6 top-20 z-50 rounded-lg px-4 py-3 text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40'
              : 'bg-red-500/20 text-red-400 border border-red-500/40'
          }`}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-bold text-white">{company.name}</h1>
            <span className="rounded-md bg-white/10 px-2.5 py-0.5 font-mono text-sm text-zinc-300">
              {company.ticker}
            </span>
            {company.sector && (
              <span className="rounded-full bg-white/10 px-3 py-0.5 text-sm text-zinc-400">
                {company.sector}
              </span>
            )}
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-white">
              {formatPrice(currentPrice)}
            </span>
            {company.change_24h_pct != null && (
              <span
                className={`flex items-center gap-0.5 text-lg font-medium ${
                  company.change_24h_pct >= 0 ? 'text-[#00ff88]' : 'text-red-400'
                }`}
              >
                {company.change_24h_pct >= 0 ? (
                  <ArrowUpRight className="h-5 w-5" />
                ) : (
                  <ArrowDownRight className="h-5 w-5" />
                )}
                {company.change_24h_pct >= 0 ? '+' : ''}
                {company.change_24h_pct.toFixed(2)}%
              </span>
            )}
          </div>
          <div className="mt-4 flex flex-wrap gap-6 text-sm">
            <div>
              <span className="text-zinc-500">Market Cap</span>
              <p className="font-medium text-white">{formatMarketCap(company.market_cap)}</p>
            </div>
            <div>
              <span className="text-zinc-500">Shares Outstanding</span>
              <p className="font-medium text-white">
                {company.shares_outstanding.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-zinc-500">Shares Available</span>
              <p className="font-medium text-white">
                {company.shares_available.toLocaleString()}
              </p>
            </div>
            <div>
              <span className="text-zinc-500">Your Holdings</span>
              <p className="font-medium text-white">
                {sharesOwned.toLocaleString()} shares
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${CARD} lg:col-span-2`}
        >
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold text-white">Price</h2>
            <div className="flex items-center gap-2">
              <div className="flex rounded-full border border-white/10 bg-white/[0.02] p-0.5">
                {(['Line', 'Candlestick'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setChartMode(mode)}
                    className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                      chartMode === mode
                        ? 'bg-[#00ff88] text-[#0a0a0f]'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-300'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                {(['7D', '30D', 'All'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setChartRange(r)}
                    className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
                      chartRange === r
                        ? 'bg-[#00ff88]/20 text-[#00ff88]'
                        : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-300'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div
            ref={chartContainerRef}
            className="w-full overflow-hidden rounded-xl border border-white/[0.08]"
            style={{
              height: 350,
              background: 'rgba(255,255,255,0.03)',
            }}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="lg:sticky lg:top-24 lg:self-start"
        >
          <div className={CARD}>
            <div className="flex gap-2 border-b border-white/[0.06] pb-3">
              <button
                type="button"
                onClick={() => setActiveTab('buy')}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  activeTab === 'buy'
                    ? 'bg-[#00ff88]/20 text-[#00ff88]'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-300'
                }`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('sell')}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  activeTab === 'sell'
                    ? 'bg-red-500/20 text-red-400'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-300'
                }`}
              >
                Sell
              </button>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-zinc-400">Quantity</label>
              <input
                type="number"
                min={1}
                max={activeTab === 'sell' && sellableQuantity > 0 ? sellableQuantity : undefined}
                value={quantity}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '')
                  if (activeTab === 'sell' && sellableQuantity > 0) {
                    const n = parseInt(v, 10)
                    if (!Number.isNaN(n) && n > sellableQuantity) return
                  }
                  setQuantity(v)
                }}
                placeholder="0"
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-white placeholder-zinc-500 focus:border-[#00ff88] focus:outline-none focus:ring-1 focus:ring-[#00ff88]"
              />
            </div>
            {qtyNum > 0 && (
              <p className="mt-2 text-sm text-zinc-400">
                Total: <span className="font-medium text-white">{formatPrice(totalCost)}</span>
              </p>
            )}
            <p className="mt-1 text-xs text-zinc-500">
              Cash: {formatPrice(cashBalance)}
            </p>
            {activeTab === 'sell' && (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-[#00ff88]">
                  Available to sell: {sellableQuantity.toLocaleString()} shares
                </p>
                <p className="flex items-center gap-1.5 text-sm text-amber-400">
                  <Lock className="h-3.5 w-3.5 shrink-0" />
                  Locked (&lt;24hrs): {lockedQuantity.toLocaleString()} shares
                </p>
                <p className="text-xs text-zinc-500">
                  Shares purchased in the last 24 hours cannot be sold
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={handleTrade}
              disabled={
                isSubmitting ||
                qtyNum <= 0 ||
                (activeTab === 'buy' && !canAffordBuy) ||
                (activeTab === 'sell' && (sellableQuantity === 0 || !canSell))
              }
              className={`mt-4 w-full rounded-lg py-3 font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 ${
                activeTab === 'buy'
                  ? 'bg-[#00ff88]/20 text-[#00ff88] hover:bg-[#00ff88]/30'
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              }`}
            >
              {isSubmitting ? 'Processing…' : activeTab === 'buy' ? 'Buy' : 'Sell'}
            </button>
          </div>

          {holdingLots.length > 0 && (
            <div className={`${CARD} mt-4`}>
              <h2 className="mb-3 font-semibold text-white">Holding lots</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.06] text-left text-zinc-400">
                      <th className="pb-2 pr-2 font-medium">Shares</th>
                      <th className="pb-2 pr-2 font-medium">Buy Price</th>
                      <th className="pb-2 pr-2 font-medium">Purchased At</th>
                      <th className="pb-2 pr-2 font-medium">Unlocks At</th>
                      <th className="pb-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {holdingLots.map((lot) => {
                      const sellable = isLotSellable(lot.purchased_at)
                      const unlock = unlocksAt(lot.purchased_at)
                      return (
                        <tr
                          key={lot.id}
                          className="border-b border-white/[0.04] text-zinc-300"
                        >
                          <td className="py-2 pr-2 font-medium text-white">
                            {lot.remaining_quantity.toLocaleString()}
                          </td>
                          <td className="py-2 pr-2">{formatPrice(lot.buy_price)}</td>
                          <td className="py-2 pr-2">
                            {new Date(lot.purchased_at).toLocaleString()}
                          </td>
                          <td className="py-2 pr-2">
                            {unlock.toLocaleString()}
                          </td>
                          <td className="py-2">
                            {sellable ? (
                              <span className="inline-flex items-center rounded bg-[#00ff88]/20 px-2 py-0.5 text-xs font-medium text-[#00ff88]">
                                Sellable
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                                <Lock className="h-3 w-3" />
                                Locked ({countdownToUnlock(lot.purchased_at)})
                              </span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className={`${CARD} mt-4`}>
            <h2 className="mb-3 font-semibold text-white">Set Price Alert</h2>
            <div className="flex gap-2 border-b border-white/[0.06] pb-3">
              <button
                type="button"
                onClick={() => setAlertDirection('above')}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  alertDirection === 'above'
                    ? 'bg-[#00ff88]/20 text-[#00ff88]'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-300'
                }`}
              >
                Above
              </button>
              <button
                type="button"
                onClick={() => setAlertDirection('below')}
                className={`flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                  alertDirection === 'below'
                    ? 'bg-[#00ff88]/20 text-[#00ff88]'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-300'
                }`}
              >
                Below
              </button>
            </div>
            <div className="mt-3">
              <label className="block text-sm text-zinc-400">Target price ($)</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={alertTargetPrice}
                onChange={(e) => setAlertTargetPrice(e.target.value)}
                placeholder="0.00"
                className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-white placeholder-zinc-500 focus:border-[#00ff88] focus:outline-none focus:ring-1 focus:ring-[#00ff88]"
              />
            </div>
            <button
              type="button"
              onClick={handleSetAlert}
              disabled={alertSubmitting || !alertTargetPrice.trim()}
              className="mt-3 w-full rounded-lg bg-[#00ff88]/20 py-2 text-sm font-medium text-[#00ff88] hover:bg-[#00ff88]/30 disabled:opacity-50"
            >
              {alertSubmitting ? 'Setting…' : 'Set Alert'}
            </button>
            {priceAlerts.length > 0 && (
              <ul className="mt-4 space-y-2 border-t border-white/[0.06] pt-3">
                {priceAlerts.map((a) => (
                  <li
                    key={a.id}
                    className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm"
                  >
                    <span className="text-zinc-300">
                      {a.direction === 'above' ? '↑' : '↓'} {formatPrice(a.target_price)}
                      {a.is_triggered && (
                        <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-xs text-amber-400">
                          Triggered
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteAlert(a.id)}
                      className="rounded p-1 text-zinc-500 hover:bg-red-500/20 hover:text-red-400"
                      aria-label="Delete alert"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={CARD}
      >
        <h2 className="mb-4 font-semibold text-white">Recent Orders</h2>
        {recentOrders.length === 0 ? (
          <p className="text-sm text-zinc-500">No orders yet for this stock.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-sm text-zinc-400">
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Quantity</th>
                  <th className="pb-3 font-medium">Price</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-b border-white/[0.04] text-sm"
                  >
                    <td className="py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                          o.side === 'buy'
                            ? 'bg-[#00ff88]/20 text-[#00ff88]'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {o.side === 'buy' ? 'Buy' : 'Sell'}
                      </span>
                    </td>
                    <td className="py-3 text-white">{o.quantity.toLocaleString()}</td>
                    <td className="py-3 text-zinc-300">{formatPrice(o.price)}</td>
                    <td className="py-3 text-zinc-300">
                      {formatPrice(o.quantity * o.price)}
                    </td>
                    <td className="py-3 text-zinc-500">
                      {new Date(o.executed_at ?? o.created_at).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className={CARD}
      >
        <h2 className="mb-4 font-semibold text-white">Related News</h2>
        {relatedNews.length === 0 ? (
          <p className="text-sm text-zinc-500">No related news.</p>
        ) : (
          <ul className="space-y-3">
            {relatedNews.map((n) => (
              <li
                key={n.id}
                className="rounded-lg border border-white/[0.06] bg-white/[0.02] transition-colors hover:bg-white/[0.04]"
              >
                <button
                  type="button"
                  onClick={() =>
                    setExpandedNewsId((id) => (id === n.id ? null : n.id))
                  }
                  className="w-full px-4 py-3 text-left"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="font-medium text-white">{n.title}</span>
                    <div className="flex items-center gap-2 shrink-0">
                      {n.is_pinned && (
                        <Pin className="h-4 w-4 text-amber-400" />
                      )}
                      <span className="text-xs text-zinc-500">
                        {new Date(n.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <AnimatePresence>
                    {expandedNewsId === n.id && (
                      <motion.p
                        key={n.id}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="mt-2 overflow-hidden text-sm text-zinc-400"
                      >
                        {n.body}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </button>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  )
}
