'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Rocket } from 'lucide-react'

const GREEN = '#00ff88'
const CARD = 'rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md'

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function countdown(deadline: string): string {
  const end = new Date(deadline).getTime()
  const now = Date.now()
  const d = Math.max(0, end - now)
  const days = Math.floor(d / (24 * 60 * 60 * 1000))
  const h = Math.floor((d % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  const m = Math.floor((d % (60 * 60 * 1000)) / (60 * 1000))
  if (days > 0) return `${days}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}

type IPOWithMeta = {
  id: string
  company_id: string
  initial_price: number
  shares_offered: number
  shares_applied: number
  subscription_deadline: string
  status: string
  created_at: string
  companies: {
    id: string
    name: string
    ticker: string
    sector: string
    description: string
    current_price: number
  } | null
  applications_count: number
  my_application: { shares_requested: number; amount_paid: number } | null
}

type IPOMarketContentProps = {
  ipos: IPOWithMeta[]
  cashBalance: number
}

export function IPOMarketContent({ ipos, cashBalance }: IPOMarketContentProps) {
  const [submittingId, setSubmittingId] = useState<string | null>(null)
  const [sharesByIpo, setSharesByIpo] = useState<Record<string, string>>({})
  const [errorByIpo, setErrorByIpo] = useState<Record<string, string>>({})

  async function handleApply(ipo: IPOWithMeta) {
    const raw = sharesByIpo[ipo.id] ?? ''
    const shares = parseInt(raw, 10) || 0
    if (shares < 1) {
      setErrorByIpo((prev) => ({ ...prev, [ipo.id]: 'Enter a valid share amount' }))
      return
    }
    const cost = shares * ipo.initial_price
    if (cost > cashBalance) {
      setErrorByIpo((prev) => ({ ...prev, [ipo.id]: 'Insufficient cash' }))
      return
    }
    setSubmittingId(ipo.id)
    setErrorByIpo((prev) => ({ ...prev, [ipo.id]: '' }))
    try {
      const res = await fetch('/api/ipo/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipo_id: ipo.id, shares_requested: shares }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Apply failed')
      setSharesByIpo((prev) => ({ ...prev, [ipo.id]: '' }))
      window.location.reload()
    } catch (e) {
      setErrorByIpo((prev) => ({ ...prev, [ipo.id]: e instanceof Error ? e.message : 'Apply failed' }))
    } finally {
      setSubmittingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Rocket className="h-8 w-8" style={{ color: GREEN }} />
        <h1 className="text-2xl font-bold text-white">IPO Market</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${CARD} border-[#00ff88]/20`}
      >
        <p className="text-sm text-zinc-300">
          Apply for shares in newly listed companies before they hit the open market.
        </p>
      </motion.div>

      {ipos.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] py-16 backdrop-blur-md"
        >
          <Rocket className="mb-4 h-16 w-16 text-zinc-500" />
          <p className="text-lg font-medium text-white">No active IPOs right now.</p>
          <p className="mt-1 text-sm text-zinc-400">Check back soon.</p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {ipos.map((ipo, i) => {
            const offered = ipo.shares_offered ?? 0
            const applied = ipo.shares_applied ?? 0
            const ratio = offered > 0 ? applied / offered : 0
            const progressPct = Math.min(ratio * 100, 250)
            const progressColor =
              ratio > 2 ? 'bg-red-500' : ratio >= 1 ? 'bg-amber-500' : 'bg-[#00ff88]'
            const oversubscribed = applied > offered
            const estimatedAllocation =
              ipo.my_application && oversubscribed && applied > 0
                ? Math.floor((offered * ipo.my_application.shares_requested) / applied)
                : ipo.my_application?.shares_requested ?? 0

            return (
              <motion.div
                key={ipo.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06 }}
                className={CARD}
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold text-white">
                    {ipo.companies?.name ?? 'Company'}
                  </h2>
                  <span className="rounded-md bg-[#00ff88]/20 px-2 py-0.5 font-mono text-sm text-[#00ff88]">
                    {ipo.companies?.ticker ?? '—'}
                  </span>
                  {ipo.companies?.sector && (
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs text-zinc-400">
                      {ipo.companies.sector}
                    </span>
                  )}
                  {oversubscribed && (
                    <span className="rounded bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400">
                      OVERSUBSCRIBED
                    </span>
                  )}
                </div>

                <p className="mt-2 text-2xl font-bold" style={{ color: GREEN }}>
                  {formatCurrency(ipo.initial_price)}
                </p>
                <p className="text-xs text-zinc-500">IPO Price</p>

                <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                  <span className="text-zinc-500">Shares offered</span>
                  <span className="text-white">{offered.toLocaleString()}</span>
                  <span className="text-zinc-500">Shares applied</span>
                  <span className="text-white">{applied.toLocaleString()}</span>
                  <span className="text-zinc-500">Oversubscription</span>
                  <span className="text-white">
                    {offered > 0 ? (applied / offered).toFixed(2) : '—'}x
                  </span>
                </div>

                <p className="mt-2 text-xs text-zinc-500">
                  Deadline: {new Date(ipo.subscription_deadline).toLocaleString()} ·{' '}
                  <span className="text-zinc-400">{countdown(ipo.subscription_deadline)}</span>
                </p>

                <div className="mt-3">
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full transition-all ${progressColor}`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    Subscribed: {offered > 0 ? ((applied / offered) * 100).toFixed(0) : 0}%
                  </p>
                </div>

                {ipo.my_application ? (
                  <div className="mt-4 rounded-lg border border-[#00ff88]/30 bg-[#00ff88]/10 p-3">
                    <span className="inline-block rounded bg-[#00ff88]/20 px-2 py-0.5 text-xs font-medium text-[#00ff88]">
                      Applied
                    </span>
                    <p className="mt-2 text-sm text-zinc-300">
                      Requested: {ipo.my_application.shares_requested.toLocaleString()} shares ·{' '}
                      {formatCurrency(ipo.my_application.amount_paid)} held in reserve
                    </p>
                    {oversubscribed && (
                      <p className="mt-1 text-xs text-zinc-500">
                        Est. allocation (pro-rata): ~{estimatedAllocation.toLocaleString()} shares
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-4 space-y-2">
                    <label className="block text-sm text-zinc-400">Shares</label>
                    <input
                      type="number"
                      min={1}
                      value={sharesByIpo[ipo.id] ?? ''}
                      onChange={(e) =>
                        setSharesByIpo((prev) => ({ ...prev, [ipo.id]: e.target.value }))
                      }
                      className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white focus:border-[#00ff88] focus:outline-none focus:ring-1 focus:ring-[#00ff88]"
                      placeholder="0"
                    />
                    {(() => {
                      const raw = sharesByIpo[ipo.id] ?? ''
                      const s = parseInt(raw, 10) || 0
                      const cost = s * ipo.initial_price
                      return (
                        <>
                          {s > 0 && (
                            <p className="text-sm text-zinc-400">
                              Total cost: <span className="font-medium text-white">{formatCurrency(cost)}</span>
                            </p>
                          )}
                          <p className="text-xs text-zinc-500">Available cash: {formatCurrency(cashBalance)}</p>
                        </>
                      )
                    })()}
                    {errorByIpo[ipo.id] && (
                      <p className="text-sm text-red-400">{errorByIpo[ipo.id]}</p>
                    )}
                    <button
                      type="button"
                      onClick={() => handleApply(ipo)}
                      disabled={submittingId === ipo.id}
                      className="w-full rounded-lg bg-[#00ff88]/20 py-2 text-sm font-medium text-[#00ff88] hover:bg-[#00ff88]/30 disabled:opacity-50"
                    >
                      {submittingId === ipo.id ? 'Applying…' : 'Apply Now'}
                    </button>
                  </div>
                )}

                <p className="mt-3 text-xs text-zinc-500">
                  Shares allocated pro-rata if oversubscribed.
                </p>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
