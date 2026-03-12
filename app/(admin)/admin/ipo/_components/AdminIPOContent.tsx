'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Zap } from 'lucide-react'

const RED = '#ef4444'
const CARD =
  'rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md'

type IPOWithCompany = {
  id: string
  company_id: string
  initial_price: number
  shares_offered: number
  shares_applied: number
  subscription_deadline: string
  status: string
  created_at: string
  companies: { id: string; name: string; ticker: string } | null
  applications_count: number
}

type CompanyOption = { id: string; name: string; ticker: string }

type AdminIPOContentProps = {
  ipos: IPOWithCompany[]
  companiesNotInIpo: CompanyOption[]
}

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

export function AdminIPOContent({ ipos: initialIpos, companiesNotInIpo }: AdminIPOContentProps) {
  const [ipos, setIpos] = useState(initialIpos)
  const [companyId, setCompanyId] = useState('')
  const [initialPrice, setInitialPrice] = useState('')
  const [sharesOffered, setSharesOffered] = useState('')
  const [subscriptionDeadline, setSubscriptionDeadline] = useState('')
  const [loading, setLoading] = useState(false)
  const [allocatingId, setAllocatingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleLaunch() {
    if (!companyId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/ipo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          initial_price: parseFloat(initialPrice) || 0,
          shares_offered: parseInt(sharesOffered, 10) || 0,
          subscription_deadline: subscriptionDeadline || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to launch IPO')
      setIpos((prev) => [
        {
          id: data.ipo.id,
          company_id: data.ipo.company_id,
          initial_price: data.ipo.initial_price,
          shares_offered: data.ipo.shares_offered,
          shares_applied: data.ipo.shares_applied ?? 0,
          subscription_deadline: data.ipo.subscription_deadline,
          status: data.ipo.status,
          created_at: data.ipo.created_at,
          companies: companiesNotInIpo.find((c) => c.id === companyId) ?? null,
          applications_count: 0,
        },
        ...prev,
      ])
      setCompanyId('')
      setInitialPrice('')
      setSharesOffered('')
      setSubscriptionDeadline('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to launch IPO')
    } finally {
      setLoading(false)
    }
  }

  async function handleAllocate(ipoId: string) {
    setAllocatingId(ipoId)
    setError(null)
    try {
      const res = await fetch('/api/ipo/allocate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipo_id: ipoId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Allocation failed')
      setIpos((prev) =>
        prev.map((ipo) =>
          ipo.id === ipoId ? { ...ipo, status: 'allocated' } : ipo
        )
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Allocation failed')
    } finally {
      setAllocatingId(null)
    }
  }

  const statusColor = (s: string) =>
    s === 'open' ? 'bg-amber-500/20 text-amber-400' : s === 'allocated' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-zinc-500/20 text-zinc-400'

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-8 w-8" style={{ color: RED }} />
        <h1 className="text-2xl font-bold text-white">Admin IPO</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={CARD}
        >
          <h2 className="mb-4 font-semibold text-white">Launch New IPO</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Company</label>
              <select
                value={companyId}
                onChange={(e) => setCompanyId(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white focus:border-[#ef4444] focus:outline-none focus:ring-1 focus:ring-[#ef4444]"
              >
                <option value="" className="bg-zinc-900">Select company</option>
                {companiesNotInIpo.map((c) => (
                  <option key={c.id} value={c.id} className="bg-zinc-900">
                    {c.name} ({c.ticker})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Initial price</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={initialPrice}
                onChange={(e) => setInitialPrice(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white focus:border-[#ef4444] focus:outline-none focus:ring-1 focus:ring-[#ef4444]"
                placeholder="10.00"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Shares offered</label>
              <input
                type="number"
                min="1"
                value={sharesOffered}
                onChange={(e) => setSharesOffered(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white focus:border-[#ef4444] focus:outline-none focus:ring-1 focus:ring-[#ef4444]"
                placeholder="100000"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Subscription deadline</label>
              <input
                type="datetime-local"
                value={subscriptionDeadline}
                onChange={(e) => setSubscriptionDeadline(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white focus:border-[#ef4444] focus:outline-none focus:ring-1 focus:ring-[#ef4444]"
              />
            </div>
            <button
              type="button"
              onClick={handleLaunch}
              disabled={loading || !companyId || !initialPrice || !sharesOffered}
              className="w-full rounded-lg bg-[#ef4444] py-2 text-sm font-medium text-white hover:bg-[#ef4444]/90 disabled:opacity-50"
            >
              {loading ? 'Launching...' : 'Launch IPO'}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={CARD}
        >
          <h2 className="mb-4 font-semibold text-white">Active & Past IPOs</h2>
          <ul className="space-y-3 max-h-[500px] overflow-y-auto">
            {ipos.map((ipo, i) => (
              <motion.li
                key={ipo.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-lg border border-white/[0.06] bg-black/20 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">
                      {ipo.companies?.name ?? 'Company'} ({ipo.companies?.ticker ?? '—'})
                    </p>
                    <p className="text-sm text-zinc-400">
                      {formatCurrency(ipo.initial_price)} · {ipo.shares_offered.toLocaleString()} shares · applied: {ipo.shares_applied.toLocaleString()}
                    </p>
                    <p className="text-xs text-zinc-500">
                      Deadline: {new Date(ipo.subscription_deadline).toLocaleString()} · {ipo.status === 'open' && countdown(ipo.subscription_deadline)}
                    </p>
                    <p className="text-xs text-zinc-500">Applications: {ipo.applications_count}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded px-2 py-0.5 text-xs ${statusColor(ipo.status)}`}>
                      {ipo.status}
                    </span>
                    {ipo.status === 'open' && (
                      <button
                        type="button"
                        onClick={() => handleAllocate(ipo.id)}
                        disabled={allocatingId === ipo.id}
                        className="flex items-center gap-1 rounded bg-[#ef4444]/20 px-2 py-1 text-xs font-medium text-[#ef4444] hover:bg-[#ef4444]/30 disabled:opacity-50"
                      >
                        <Zap className="h-3 w-3" />
                        {allocatingId === ipo.id ? 'Allocating...' : 'Close & Allocate'}
                      </button>
                    )}
                  </div>
                </div>
              </motion.li>
            ))}
            {ipos.length === 0 && (
              <p className="py-6 text-center text-zinc-500">No IPOs yet.</p>
            )}
          </ul>
        </motion.div>
      </div>
    </div>
  )
}
