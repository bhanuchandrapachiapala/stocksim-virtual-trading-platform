'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, ArrowUpRight, ArrowDownRight, TrendingUp } from 'lucide-react'
import type { MarketCompany } from '../page'

type SortKey = 'price' | 'market_cap' | 'change_24h' | null

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

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function getAvatarColor(ticker: string): string {
  const colors = [
    'bg-emerald-500/20 text-emerald-400',
    'bg-blue-500/20 text-blue-400',
    'bg-violet-500/20 text-violet-400',
    'bg-amber-500/20 text-amber-400',
    'bg-rose-500/20 text-rose-400',
    'bg-cyan-500/20 text-cyan-400',
  ]
  let n = 0
  for (let i = 0; i < ticker.length; i++) n += ticker.charCodeAt(i)
  return colors[n % colors.length]
}

const CARD_STYLE =
  'rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-md'

type MarketContentProps = {
  companies: MarketCompany[]
  topGainer: MarketCompany | null
  topLoser: MarketCompany | null
  mostActive: MarketCompany | null
}

export function MarketContent({
  companies,
  topGainer,
  topLoser,
  mostActive,
}: MarketContentProps) {
  const [search, setSearch] = useState('')
  const [sector, setSector] = useState<string>('All')
  const [sortKey, setSortKey] = useState<SortKey>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sectors = useMemo(() => {
    const set = new Set(companies.map((c) => c.sector).filter(Boolean))
    return ['All', ...Array.from(set).sort()]
  }, [companies])

  const filteredAndSorted = useMemo(() => {
    let list = companies.filter((c) => {
      const matchSearch =
        !search ||
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.ticker.toLowerCase().includes(search.toLowerCase())
      const matchSector = sector === 'All' || c.sector === sector
      return matchSearch && matchSector
    })

    if (sortKey) {
      list = [...list].sort((a, b) => {
        let va: number, vb: number
        if (sortKey === 'price') {
          va = a.current_price
          vb = b.current_price
        } else if (sortKey === 'market_cap') {
          va = a.market_cap
          vb = b.market_cap
        } else {
          va = a.change_24h_pct ?? 0
          vb = b.change_24h_pct ?? 0
        }
        if (va < vb) return sortDir === 'asc' ? -1 : 1
        if (va > vb) return sortDir === 'asc' ? 1 : -1
        return 0
      })
    }

    return list
  }, [companies, search, sector, sortKey, sortDir])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-white">Market Overview</h1>
        <p className="text-sm text-zinc-400">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'short',
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={CARD_STYLE}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Top Gainer Today
          </p>
          {topGainer ? (
            <>
              <p className="mt-1 font-semibold text-white">{topGainer.name}</p>
              <p className="text-sm text-zinc-400">{topGainer.ticker}</p>
              <p className="mt-2 flex items-center gap-1 text-lg font-bold text-[#00ff88]">
                <ArrowUpRight className="h-5 w-5" />
                {topGainer.change_24h_pct != null
                  ? `+${topGainer.change_24h_pct.toFixed(2)}%`
                  : '—'}
              </p>
            </>
          ) : (
            <p className="mt-2 text-zinc-500">—</p>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={CARD_STYLE}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Top Loser Today
          </p>
          {topLoser ? (
            <>
              <p className="mt-1 font-semibold text-white">{topLoser.name}</p>
              <p className="text-sm text-zinc-400">{topLoser.ticker}</p>
              <p className="mt-2 flex items-center gap-1 text-lg font-bold text-red-400">
                <ArrowDownRight className="h-5 w-5" />
                {topLoser.change_24h_pct != null
                  ? `${topLoser.change_24h_pct.toFixed(2)}%`
                  : '—'}
              </p>
            </>
          ) : (
            <p className="mt-2 text-zinc-500">—</p>
          )}
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={CARD_STYLE}
        >
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Most Active
          </p>
          {mostActive ? (
            <>
              <p className="mt-1 font-semibold text-white">{mostActive.name}</p>
              <p className="text-sm text-zinc-400">{mostActive.ticker}</p>
              <p className="mt-2 flex items-center gap-1 text-lg font-bold text-zinc-300">
                <TrendingUp className="h-5 w-5" />
                {formatMarketCap(mostActive.market_cap)}
              </p>
            </>
          ) : (
            <p className="mt-2 text-zinc-500">—</p>
          )}
        </motion.div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="search"
          placeholder="Search companies or tickers..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-white/[0.08] bg-white/[0.04] py-2.5 pl-10 pr-4 text-white placeholder-zinc-500 focus:border-[#00ff88] focus:outline-none focus:ring-1 focus:ring-[#00ff88]"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {sectors.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSector(s)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              sector === s
                ? 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40'
                : 'border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-300'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md"
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr className="border-b border-white/[0.06] text-left text-sm text-zinc-400">
                <th className="px-5 py-3 font-medium w-12">#</th>
                <th className="px-5 py-3 font-medium">Company</th>
                <th className="px-5 py-3 font-medium">Ticker</th>
                <th className="px-5 py-3 font-medium">Sector</th>
                <th className="px-5 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => handleSort('price')}
                    className="hover:text-white transition-colors"
                  >
                    Price {sortKey === 'price' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => handleSort('change_24h')}
                    className="hover:text-white transition-colors"
                  >
                    24h Change {sortKey === 'change_24h' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">
                  <button
                    type="button"
                    onClick={() => handleSort('market_cap')}
                    className="hover:text-white transition-colors"
                  >
                    Market Cap {sortKey === 'market_cap' && (sortDir === 'asc' ? '↑' : '↓')}
                  </button>
                </th>
                <th className="px-5 py-3 font-medium">Shares Available</th>
                <th className="px-5 py-3 font-medium w-24">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {filteredAndSorted.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className="group border-b border-white/[0.04] transition-colors hover:border-l-4 hover:border-l-[#00ff88]/50 hover:bg-white/[0.04]"
                  >
                    <td className="px-5 py-3 text-zinc-500">{i + 1}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${getAvatarColor(c.ticker)}`}
                        >
                          {getInitials(c.name)}
                        </div>
                        <span className="font-medium text-white">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3 font-mono text-sm text-zinc-300">
                      {c.ticker}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">{c.sector || '—'}</td>
                    <td className="px-5 py-3 font-medium text-white">
                      {formatPrice(c.current_price)}
                    </td>
                    <td className="px-5 py-3">
                      {c.change_24h_pct != null ? (
                        <span
                          className={`inline-flex items-center gap-0.5 font-medium ${
                            c.change_24h_pct >= 0
                              ? 'text-[#00ff88]'
                              : 'text-red-400'
                          }`}
                        >
                          {c.change_24h_pct >= 0 ? (
                            <ArrowUpRight className="h-4 w-4" />
                          ) : (
                            <ArrowDownRight className="h-4 w-4" />
                          )}
                          {c.change_24h_pct >= 0 ? '+' : ''}
                          {c.change_24h_pct.toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-zinc-300">
                      {formatMarketCap(c.market_cap)}
                    </td>
                    <td className="px-5 py-3 text-zinc-400">
                      {c.shares_available.toLocaleString()}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/stocks/${c.ticker}`}
                        className="inline-flex items-center justify-center rounded-lg border border-[#00ff88]/50 bg-[#00ff88]/10 px-3 py-1.5 text-sm font-medium text-[#00ff88] transition-colors hover:bg-[#00ff88]/20"
                      >
                        Buy
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        {filteredAndSorted.length === 0 && (
          <p className="px-5 py-12 text-center text-zinc-500">
            No companies match your search or filter.
          </p>
        )}
      </motion.div>
    </div>
  )
}
