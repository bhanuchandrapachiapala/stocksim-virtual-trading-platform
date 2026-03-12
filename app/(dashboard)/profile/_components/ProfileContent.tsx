'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Tooltip as PieTooltip,
} from 'recharts'
import {
  Trophy,
  Lock,
  TrendingUp,
  Users,
  Landmark,
  BarChart3,
  Target,
  Award,
} from 'lucide-react'

const CARD_STYLE =
  'rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md'

const BADGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'First Trade': TrendingUp,
  Diversified: BarChart3,
  Whale: Award,
  'Loan Shark Survivor': Landmark,
  'Fund Manager': Users,
  'Bear Survivor': Target,
  'Top 10': Trophy,
}

const COLORS = ['#00ff88', '#3b82f6', '#a855f7', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899']

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

type ProfileContentProps = {
  user: {
    display_name: string
    email: string
    avatar_url: string | null
    cash_balance: number
    created_at: string
    is_bankrupt: boolean
  }
  netWorth: number
  pnlPct: number
  daysActive: number
  rank: number
  totalTrades: number
  fundsCount: number
  snapshots: Array<{ value: number; recorded_at: string }>
  portfolioBreakdown: Array<{ name: string; value: number }>
  achievements: Array<{ name: string; earned: boolean; earned_at: string | null }>
  transactions: Array<{
    id: string
    type: string
    amount: number
    description: string
    created_at: string
  }>
}

const TX_TYPE_COLOR: Record<string, string> = {
  buy: 'bg-[#00ff88]/20 text-[#00ff88]',
  sell: 'bg-red-500/20 text-red-400',
  loan_disbursed: 'bg-blue-500/20 text-blue-400',
  loan_repayment: 'bg-amber-500/20 text-amber-400',
  fund_contribution: 'bg-violet-500/20 text-violet-400',
  fund_exit: 'bg-cyan-500/20 text-cyan-400',
}

export function ProfileContent({
  user,
  netWorth,
  pnlPct,
  daysActive,
  rank,
  totalTrades,
  fundsCount,
  snapshots,
  portfolioBreakdown,
  achievements,
  transactions,
}: ProfileContentProps) {
  const [chartRange, setChartRange] = useState<'7D' | '30D' | 'All'>('30D')
  const [txPage, setTxPage] = useState(0)
  const TX_PER_PAGE = 10

  const chartData = useMemo(() => {
    const data = snapshots.map((s) => ({
      value: s.value,
      date: formatDate(s.recorded_at),
      full: new Date(s.recorded_at),
    }))
    if (chartRange === 'All') return data
    const days = chartRange === '7D' ? 7 : 30
    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - days)
    return data.filter((d) => d.full >= cutoff)
  }, [snapshots, chartRange])

  const totalBreakdown = portfolioBreakdown.reduce((s, p) => s + p.value, 0)
  const pieData = portfolioBreakdown.map((p) => ({
    ...p,
    percentage: totalBreakdown > 0 ? (p.value / totalBreakdown) * 100 : 0,
  }))

  const paginatedTx = useMemo(() => {
    const start = txPage * TX_PER_PAGE
    return transactions.slice(start, start + TX_PER_PAGE)
  }, [transactions, txPage])
  const totalTxPages = Math.ceil(transactions.length / TX_PER_PAGE)

  const initial = (user.display_name?.charAt(0) ?? user.email?.charAt(0) ?? '?').toUpperCase()

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={CARD_STYLE}
      >
        <div className="flex flex-wrap items-start gap-6">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full bg-[#00ff88]/20 text-4xl font-bold text-[#00ff88]">
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt=""
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              initial
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold text-white">{user.display_name || 'Trader'}</h1>
              <button
                type="button"
                className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-zinc-300"
                title="Edit profile (coming soon)"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            </div>
            <p className="text-zinc-400">{user.email}</p>
            <p className="mt-1 text-sm text-zinc-500">
              Joined {formatDate(user.created_at)} · {daysActive} days active
            </p>
            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <span className="font-semibold text-white">{formatCurrency(netWorth)}</span>
              <span className="text-zinc-500">Net Worth</span>
              <span className="text-zinc-500">·</span>
              <span className={`font-semibold ${pnlPct >= 0 ? 'text-[#00ff88]' : 'text-red-400'}`}>
                {pnlPct >= 0 ? '+' : ''}
                {pnlPct.toFixed(1)}% P&L
              </span>
              <span className="text-zinc-500">·</span>
              <span className="font-semibold text-white">#{rank}</span>
              <span className="text-zinc-500">Rank</span>
              <span className="text-zinc-500">·</span>
              <span className="font-semibold text-white">{totalTrades}</span>
              <span className="text-zinc-500">Trades</span>
              <span className="text-zinc-500">·</span>
              <span className="font-semibold text-white">{fundsCount}</span>
              <span className="text-zinc-500">Funds</span>
            </div>
            {user.is_bankrupt && (
              <span className="mt-2 inline-block rounded bg-red-500/20 px-2 py-0.5 text-sm font-medium text-red-400">
                Bankrupt
              </span>
            )}
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className={CARD_STYLE}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-white">Net Worth History</h2>
          <div className="flex gap-1">
            {(['7D', '30D', 'All'] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setChartRange(r)}
                className={`rounded px-3 py-1 text-sm font-medium ${
                  chartRange === r ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'text-zinc-400 hover:bg-white/5'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>
        <div className="h-64">
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="netWorthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#00ff88" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#00ff88" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" stroke="#71717a" tick={{ fill: '#71717a', fontSize: 11 }} />
                <YAxis stroke="#71717a" tick={{ fill: '#71717a', fontSize: 11 }} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div className="rounded-lg border border-white/10 bg-zinc-900/95 px-3 py-2 shadow-xl">
                        <p className="text-xs text-zinc-400">{payload[0].payload.date}</p>
                        <p className="font-semibold text-[#00ff88]">
                          {formatCurrency(payload[0].value as number)}
                        </p>
                      </div>
                    )
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#00ff88"
                  fill="url(#netWorthGrad)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="flex h-full items-center text-sm text-zinc-500">No history yet</p>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={CARD_STYLE}
        >
          <h2 className="mb-4 font-semibold text-white">Portfolio Breakdown</h2>
          {pieData.length > 0 ? (
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="h-48 w-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percentage }) => `${name} ${percentage.toFixed(0)}%`}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <PieTooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="space-y-1 text-sm">
                {pieData.map((p, i) => (
                  <li key={p.name} className="flex items-center gap-2">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    {p.name}: {formatCurrency(p.value)} ({p.percentage.toFixed(1)}%)
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="text-sm text-zinc-500">No holdings</p>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={CARD_STYLE}
        >
          <h2 className="mb-4 font-semibold text-white">Achievements</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {achievements.map((a, i) => {
              const Icon = BADGE_ICONS[a.name] ?? Trophy
              return (
                <motion.div
                  key={a.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.03 }}
                  className={`flex flex-col items-center rounded-lg border p-3 ${
                    a.earned
                      ? 'border-[#00ff88]/30 bg-[#00ff88]/10'
                      : 'border-white/10 bg-white/[0.02] opacity-60'
                  }`}
                >
                  {a.earned ? (
                    <Icon className="h-8 w-8 text-[#00ff88]" />
                  ) : (
                    <Lock className="h-8 w-8 text-zinc-500" />
                  )}
                  <p className="mt-1 text-center text-xs font-medium text-white">{a.name}</p>
                  {a.earned && a.earned_at && (
                    <p className="mt-0.5 text-xs text-zinc-500">
                      {formatDate(a.earned_at)}
                    </p>
                  )}
                </motion.div>
              )
            })}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className={CARD_STYLE}
      >
        <h2 className="mb-4 font-semibold text-white">Transaction History</h2>
        {transactions.length === 0 ? (
          <p className="text-sm text-zinc-500">No transactions yet</p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-sm text-zinc-400">
                    <th className="pb-2 font-medium">Type</th>
                    <th className="pb-2 font-medium">Description</th>
                    <th className="pb-2 font-medium">Amount</th>
                    <th className="pb-2 font-medium">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedTx.map((tx) => (
                    <tr key={tx.id} className="border-b border-white/[0.04] text-sm">
                      <td className="py-2">
                        <span
                          className={`rounded px-2 py-0.5 text-xs font-medium ${
                            TX_TYPE_COLOR[tx.type] ?? 'bg-white/10 text-zinc-400'
                          }`}
                        >
                          {tx.type.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2 text-zinc-300">{tx.description}</td>
                      <td
                        className={`py-2 font-medium ${
                          tx.amount >= 0 ? 'text-[#00ff88]' : 'text-red-400'
                        }`}
                      >
                        {tx.amount >= 0 ? '+' : ''}
                        {formatCurrency(tx.amount)}
                      </td>
                      <td className="py-2 text-zinc-500">
                        {formatDate(tx.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {totalTxPages > 1 && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setTxPage((p) => Math.max(0, p - 1))}
                  disabled={txPage === 0}
                  className="rounded border border-white/10 px-3 py-1 text-sm disabled:opacity-50"
                >
                  Prev
                </button>
                <span className="text-sm text-zinc-400">
                  Page {txPage + 1} of {totalTxPages}
                </span>
                <button
                  type="button"
                  onClick={() => setTxPage((p) => Math.min(totalTxPages - 1, p + 1))}
                  disabled={txPage >= totalTxPages - 1}
                  className="rounded border border-white/10 px-3 py-1 text-sm disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  )
}
