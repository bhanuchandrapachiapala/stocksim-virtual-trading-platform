'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Star, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { LineChart, Line, ResponsiveContainer } from 'recharts'

const CARD_STYLE =
  'rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

type WatchlistItem = {
  company_id: string
  name: string
  ticker: string
  sector: string
  current_price: number
  change_24h_pct: number | null
  sparkline_data: Array<{ price: number }>
  owned_quantity: number
}

type WatchlistContentProps = {
  items: WatchlistItem[]
}

export function WatchlistContent({ items }: WatchlistContentProps) {
  const router = useRouter()
  const [removingId, setRemovingId] = useState<string | null>(null)

  const handleRemove = async (companyId: string) => {
    setRemovingId(companyId)
    try {
      const res = await fetch('/api/watchlist/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Failed to remove')
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to remove')
    } finally {
      setRemovingId(null)
    }
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Star className="h-8 w-8 text-[#00ff88]" />
          <h1 className="text-2xl font-bold text-white">Watchlist</h1>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] py-16 backdrop-blur-md"
        >
          <Star className="h-14 w-14 text-zinc-600" />
          <p className="mt-4 text-zinc-400">
            No stocks on your watchlist yet
          </p>
          <Link
            href="/market"
            className="mt-6 rounded-lg bg-[#00ff88]/20 px-4 py-2 font-medium text-[#00ff88] transition-colors hover:bg-[#00ff88]/30"
          >
            Browse Market
          </Link>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Star className="h-8 w-8 text-[#00ff88]" />
        <h1 className="text-2xl font-bold text-white">Watchlist</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {items.map((item, i) => (
          <motion.article
            key={item.company_id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 + i * 0.04 }}
            className={CARD_STYLE}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-semibold text-white">{item.name}</h3>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-xs text-zinc-400">
                    {item.ticker}
                  </span>
                  {item.sector && (
                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-zinc-500">
                      {item.sector}
                    </span>
                  )}
                </div>
              </div>
              {item.owned_quantity > 0 && (
                <span className="shrink-0 rounded bg-[#00ff88]/20 px-2 py-0.5 text-xs font-medium text-[#00ff88]">
                  Hold {item.owned_quantity}
                </span>
              )}
            </div>
            <p className="mt-3 text-2xl font-bold text-white">
              {formatCurrency(item.current_price)}
            </p>
            {item.change_24h_pct != null && (
              <p
                className={`mt-0.5 flex items-center gap-0.5 text-sm font-medium ${
                  item.change_24h_pct >= 0 ? 'text-[#00ff88]' : 'text-red-400'
                }`}
              >
                {item.change_24h_pct >= 0 ? (
                  <ArrowUpRight className="h-4 w-4" />
                ) : (
                  <ArrowDownRight className="h-4 w-4" />
                )}
                {item.change_24h_pct >= 0 ? '+' : ''}
                {item.change_24h_pct.toFixed(2)}%
              </p>
            )}
            <div className="mt-3 h-20 w-full">
              {item.sparkline_data.length > 0 ? (
                <ResponsiveContainer width="100%" height={80}>
                  <LineChart data={item.sparkline_data} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
                    <Line
                      type="monotone"
                      dataKey="price"
                      stroke="#00ff88"
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-20 items-center text-xs text-zinc-600">
                  No price history
                </div>
              )}
            </div>
            <div className="mt-4 flex gap-2">
              <Link
                href={`/stocks/${item.ticker}`}
                className="flex-1 rounded-lg bg-[#00ff88]/20 py-2 text-center text-sm font-medium text-[#00ff88] transition-colors hover:bg-[#00ff88]/30"
              >
                View Stock
              </Link>
              <button
                type="button"
                onClick={() => handleRemove(item.company_id)}
                disabled={removingId === item.company_id}
                className="rounded-lg border border-white/10 py-2 px-3 text-sm font-medium text-zinc-400 transition-colors hover:bg-white/5 hover:text-zinc-300 disabled:opacity-50"
              >
                {removingId === item.company_id ? 'Removing…' : 'Remove'}
              </button>
            </div>
          </motion.article>
        ))}
      </div>
    </div>
  )
}
