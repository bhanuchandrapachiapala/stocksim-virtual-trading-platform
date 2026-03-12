'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { motion, useMotionValue, animate } from 'framer-motion'
import {
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Rocket,
  AlertTriangle,
  BarChart2,
  Landmark,
} from 'lucide-react'

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

function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  isPositive,
}: {
  value: number
  prefix?: string
  suffix?: string
  isPositive?: boolean
}) {
  const count = useMotionValue(0)
  const [display, setDisplay] = useState(prefix + '0.00' + suffix)

  useEffect(() => {
    const controls = animate(count, value, {
      duration: 1.2,
      ease: 'easeOut',
    })
    return controls.stop
  }, [value, count])

  useEffect(() => {
    const unsub = count.on('change', (v) => {
      setDisplay(prefix + v.toFixed(2) + suffix)
    })
    return unsub
  }, [count, prefix, suffix])

  return (
    <span className={isPositive === true ? 'text-[#00ff88]' : isPositive === false ? 'text-red-400' : ''}>
      {display}
    </span>
  )
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

function daysUntil(dueDate: string): number {
  const due = new Date(dueDate)
  const now = new Date()
  due.setHours(0, 0, 0, 0)
  now.setHours(0, 0, 0, 0)
  return Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

type HoldingRow = {
  id: string
  quantity: number
  avg_buy_price: number
  company: {
    name: string
    ticker: string
    current_price: number
  } | null
}

type TransactionRow = {
  id: string
  type: string
  amount: number
  description: string
  created_at: string
}

type LoanRow = {
  id: string
  amount_owed: number
  due_date: string
}

type DashboardContentProps = {
  displayName: string
  isBankrupt: boolean
  cashBalance: number
  netWorth: number
  portfolioValue: number
  totalPnL: number
  holdings: HoldingRow[]
  transactions: TransactionRow[]
  activeLoan: LoanRow | null
}

export function DashboardContent({
  cashBalance,
  netWorth,
  portfolioValue,
  totalPnL,
  holdings,
  transactions,
  activeLoan,
}: DashboardContentProps) {
  const hasHoldings = holdings.length > 0

  return (
    <div className="space-y-6">
      {activeLoan && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center justify-between gap-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4"
        >
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 shrink-0 text-amber-400" />
            <div>
              <p className="font-medium text-amber-200">Active loan</p>
              <p className="text-sm text-amber-200/80">
                {formatCurrency(activeLoan.amount_owed)} due in{' '}
                {daysUntil(activeLoan.due_date)} days
              </p>
            </div>
          </div>
          <Link
            href="/bank"
            className="flex items-center gap-2 rounded-lg bg-amber-500/20 px-4 py-2 text-sm font-medium text-amber-300 transition-colors hover:bg-amber-500/30"
          >
            <Landmark className="h-4 w-4" />
            Repay Now
          </Link>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
      >
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
          className={CARD_STYLE}
          style={{
            boxShadow: '0 0 40px -10px rgba(0, 255, 136, 0.15)',
          }}
        >
          <p className="text-sm font-medium text-zinc-400">Total Net Worth</p>
          <p className="mt-1 text-2xl font-bold text-white">
            <AnimatedCounter value={netWorth} prefix="$" />
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className={CARD_STYLE}
        >
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-[#00ff88]" />
            <p className="text-sm font-medium text-zinc-400">Cash Balance</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-white">
            <AnimatedCounter value={cashBalance} prefix="$" />
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className={CARD_STYLE}
        >
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-zinc-400" />
            <p className="text-sm font-medium text-zinc-400">Portfolio Value</p>
          </div>
          <p className="mt-1 text-2xl font-bold text-white">
            <AnimatedCounter value={portfolioValue} prefix="$" />
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.2 }}
          className={CARD_STYLE}
        >
          <div className="flex items-center gap-2">
            {totalPnL >= 0 ? (
              <ArrowUpRight className="h-5 w-5 text-[#00ff88]" />
            ) : (
              <ArrowDownRight className="h-5 w-5 text-red-400" />
            )}
            <p className="text-sm font-medium text-zinc-400">Total P&L</p>
          </div>
          <p className="mt-1 text-2xl font-bold">
            <AnimatedCounter
              value={totalPnL}
              prefix="$"
              isPositive={totalPnL >= 0 ? true : totalPnL < 0 ? false : undefined}
            />
          </p>
        </motion.div>
      </motion.div>

      <div className="flex flex-col gap-6 lg:flex-row">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="flex-1 overflow-hidden rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md"
        >
          <div className="border-b border-white/[0.06] px-5 py-4">
            <h2 className="font-semibold text-white">Holdings</h2>
          </div>
          {hasHoldings ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-sm text-zinc-400">
                    <th className="px-5 py-3 font-medium">Company</th>
                    <th className="px-5 py-3 font-medium">Ticker</th>
                    <th className="px-5 py-3 font-medium">Shares</th>
                    <th className="px-5 py-3 font-medium">Avg Buy</th>
                    <th className="px-5 py-3 font-medium">Current Price</th>
                    <th className="px-5 py-3 font-medium">Current Value</th>
                    <th className="px-5 py-3 font-medium">P&L%</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h, i) => {
                    const name = h.company?.name ?? '—'
                    const ticker = h.company?.ticker ?? '—'
                    const currentPrice = h.company?.current_price ?? 0
                    const currentValue = h.quantity * currentPrice
                    const costBasis = h.quantity * h.avg_buy_price
                    const pnlPct =
                      costBasis > 0
                        ? ((currentValue - costBasis) / costBasis) * 100
                        : 0
                    return (
                      <motion.tr
                        key={h.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + i * 0.04 }}
                        className="border-b border-white/[0.04] transition-colors hover:bg-white/[0.04]"
                      >
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-xs font-semibold ${getAvatarColor(ticker)}`}
                            >
                              {getInitials(name)}
                            </div>
                            <span className="font-medium text-white">
                              {name}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3 font-mono text-sm text-zinc-300">
                          {ticker}
                        </td>
                        <td className="px-5 py-3 text-white">
                          {h.quantity.toLocaleString()}
                        </td>
                        <td className="px-5 py-3 text-zinc-300">
                          {formatCurrency(h.avg_buy_price)}
                        </td>
                        <td className="px-5 py-3 text-white">
                          {formatCurrency(currentPrice)}
                        </td>
                        <td className="px-5 py-3 text-white">
                          {formatCurrency(currentValue)}
                        </td>
                        <td
                          className={`px-5 py-3 font-medium ${
                            pnlPct >= 0 ? 'text-[#00ff88]' : 'text-red-400'
                          }`}
                        >
                          {pnlPct >= 0 ? '+' : ''}
                          {pnlPct.toFixed(2)}%
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="flex flex-col items-center justify-center py-16 px-6 text-center"
            >
              <div className="rounded-full bg-white/[0.06] p-4">
                <Rocket className="h-10 w-10 text-zinc-500" />
              </div>
              <p className="mt-4 text-lg font-medium text-zinc-300">
                Start trading to build your portfolio
              </p>
              <p className="mt-1 text-sm text-zinc-500">
                Buy and sell stocks to see your holdings here.
              </p>
              <Link
                href="/market"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#00ff88]/20 px-4 py-2.5 text-sm font-medium text-[#00ff88] transition-colors hover:bg-[#00ff88]/30"
              >
                <TrendingUp className="h-4 w-4" />
                Go to Market
              </Link>
            </motion.div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          className="w-full rounded-xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-md lg:w-[320px]"
        >
          <div className="border-b border-white/[0.06] px-5 py-4">
            <h2 className="font-semibold text-white">Recent Transactions</h2>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {transactions.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-zinc-500">
                No transactions yet
              </p>
            ) : (
              <ul className="divide-y divide-white/[0.04]">
                {transactions.map((tx) => (
                  <li
                    key={tx.id}
                    className="flex items-center justify-between gap-3 px-5 py-3"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          tx.amount >= 0
                            ? 'bg-[#00ff88]/20 text-[#00ff88]'
                            : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {tx.amount >= 0 ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-white">
                          {tx.description || tx.type}
                        </p>
                        <p className="text-xs text-zinc-500">
                          {new Date(tx.created_at).toLocaleDateString()}{' '}
                          {new Date(tx.created_at).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`shrink-0 text-sm font-medium ${
                        tx.amount >= 0 ? 'text-[#00ff88]' : 'text-red-400'
                      }`}
                    >
                      {tx.amount >= 0 ? '+' : ''}
                      {formatCurrency(tx.amount)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
