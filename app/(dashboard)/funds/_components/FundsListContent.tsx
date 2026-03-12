'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Users } from 'lucide-react'

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

type FundWithMeta = {
  id: string
  name: string
  description: string
  manager_id: string
  total_value: number
  fee_percent: number
  min_buy_in: number
  created_at: string
  manager_name: string
  member_count: number
  total_contributions: number
  roi: number
  is_member: boolean
}

type FundsListContentProps = {
  funds: FundWithMeta[]
  totalFunds: number
  myActiveCount: number
  bestPerforming: FundWithMeta | null
}

export function FundsListContent({
  funds,
  totalFunds,
  myActiveCount,
  bestPerforming,
}: FundsListContentProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-8 w-8 text-[#00ff88]" />
          <h1 className="text-2xl font-bold text-white">Mutual Funds</h1>
        </div>
        <Link
          href="/funds/create"
          className="rounded-lg bg-[#00ff88]/20 px-4 py-2 font-medium text-[#00ff88] transition-colors hover:bg-[#00ff88]/30"
        >
          Create Fund
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={CARD_STYLE}
        >
          <p className="text-sm font-medium text-zinc-400">Total Funds Available</p>
          <p className="mt-1 text-2xl font-bold text-white">{totalFunds}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={CARD_STYLE}
        >
          <p className="text-sm font-medium text-zinc-400">Your Active Funds</p>
          <p className="mt-1 text-2xl font-bold text-white">{myActiveCount}</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={CARD_STYLE}
        >
          <p className="text-sm font-medium text-zinc-400">Best Performing Fund</p>
          {bestPerforming ? (
            <>
              <p className="mt-1 font-semibold text-white">{bestPerforming.name}</p>
              <p
                className={`text-lg font-bold ${
                  bestPerforming.roi >= 0 ? 'text-[#00ff88]' : 'text-red-400'
                }`}
              >
                {bestPerforming.roi >= 0 ? '+' : ''}
                {bestPerforming.roi.toFixed(1)}%
              </p>
            </>
          ) : (
            <p className="mt-1 text-zinc-500">—</p>
          )}
        </motion.div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {funds.map((fund, i) => (
          <motion.div
            key={fund.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.05 }}
            className={CARD_STYLE}
          >
            <h3 className="font-semibold text-white">{fund.name}</h3>
            <p className="mt-0.5 text-sm text-zinc-400">by {fund.manager_name}</p>
            <p className="mt-2 line-clamp-2 text-sm text-zinc-500">
              {fund.description || 'No description.'}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
              <span className="text-white">{formatCurrency(fund.total_value)}</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">{fund.member_count} members</span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">
                Min {formatCurrency(fund.min_buy_in)}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <span
                className={`text-sm font-medium ${
                  fund.roi >= 0 ? 'text-[#00ff88]' : 'text-red-400'
                }`}
              >
                {fund.roi >= 0 ? '+' : ''}
                {fund.roi.toFixed(1)}% ROI
              </span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-zinc-400">
                {fund.fee_percent}% fee
              </span>
            </div>
            <div className="mt-4">
              {fund.is_member ? (
                <Link
                  href={`/funds/${fund.id}`}
                  className="block w-full rounded-lg border border-[#00ff88]/50 bg-[#00ff88]/10 py-2 text-center text-sm font-medium text-[#00ff88] transition-colors hover:bg-[#00ff88]/20"
                >
                  View
                </Link>
              ) : (
                <Link
                  href={`/funds/${fund.id}`}
                  className="block w-full rounded-lg bg-[#00ff88]/20 py-2 text-center text-sm font-medium text-[#00ff88] transition-colors hover:bg-[#00ff88]/30"
                >
                  Join
                </Link>
              )}
            </div>
          </motion.div>
        ))}
      </div>
      {funds.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center text-zinc-500"
        >
          No funds yet. Create the first one!
        </motion.p>
      )}
    </div>
  )
}
