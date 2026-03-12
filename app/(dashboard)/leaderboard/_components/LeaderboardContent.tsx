'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Crown, Medal } from 'lucide-react'

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

type TraderRow = {
  id: string
  display_name: string
  avatar_url: string | null
  net_worth: number
  pnl_pct: number
  trades: number
  achievements: number
}

type FundRow = {
  id: string
  name: string
  total_value: number
  manager_id: string
  rank: number
  manager_name: string
  member_count: number
  roi: number
}

type LeaderboardContentProps = {
  traders: TraderRow[]
  funds: FundRow[]
  currentUserId: string
  currentUserRank: number
  currentUserNetWorth: number
  totalPlayers: number
}

export function LeaderboardContent({
  traders,
  funds,
  currentUserId,
  currentUserRank,
  currentUserNetWorth,
  totalPlayers,
}: LeaderboardContentProps) {
  const [tab, setTab] = useState<'traders' | 'funds'>('traders')

  const top3 = traders.slice(0, 3)
  const rest = traders.slice(3)

  const rankStyle = (rank: number) => {
    if (rank === 1) return 'text-amber-400 border-amber-500/40 shadow-[0_0_20px_-5px_rgba(251,191,36,0.3)]'
    if (rank === 2) return 'text-zinc-300 border-zinc-400/40 shadow-[0_0_20px_-5px_rgba(161,161,170,0.3)]'
    if (rank === 3) return 'text-amber-700 border-amber-700/40 shadow-[0_0_20px_-5px_rgba(180,83,9,0.3)]'
    return ''
  }

  const avatarRing = (rank: number) => {
    if (rank === 1) return 'ring-2 ring-amber-400'
    if (rank === 2) return 'ring-2 ring-zinc-400'
    if (rank === 3) return 'ring-2 ring-amber-700'
    return ''
  }

  return (
    <div className="space-y-6 pb-24">
      <div className="flex items-center gap-2">
        <Trophy className="h-8 w-8 text-[#00ff88]" />
        <h1 className="text-2xl font-bold text-white">Leaderboard</h1>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('traders')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'traders'
              ? 'bg-[#00ff88]/20 text-[#00ff88]'
              : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-300'
          }`}
        >
          Traders
        </button>
        <button
          type="button"
          onClick={() => setTab('funds')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'funds'
              ? 'bg-[#00ff88]/20 text-[#00ff88]'
              : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-300'
          }`}
        >
          Funds
        </button>
      </div>

      {tab === 'traders' && (
        <>
          {top3.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-end justify-center gap-4 py-6"
            >
              {top3[1] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className={`flex w-1/3 flex-col items-center rounded-xl border bg-white/[0.03] p-4 backdrop-blur-md ${rankStyle(2)}`}
                >
                  <span className="text-2xl font-bold">2</span>
                  <div
                    className={`mt-2 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-xl font-bold ${avatarRing(2)}`}
                  >
                    {top3[1].avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={top3[1].avatar_url}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      (top3[1].display_name?.charAt(0) ?? '?').toUpperCase()
                    )}
                  </div>
                  <p className="mt-2 truncate text-sm font-medium text-white">
                    {top3[1].display_name}
                  </p>
                  <p className="text-sm font-semibold">{formatCurrency(top3[1].net_worth)}</p>
                </motion.div>
              )}
              {top3[0] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 }}
                  className={`flex w-1/3 flex-col items-center rounded-xl border bg-white/[0.03] p-4 pb-8 backdrop-blur-md ${rankStyle(1)}`}
                >
                  <Crown className="h-8 w-8 text-amber-400" />
                  <span className="text-2xl font-bold">1</span>
                  <div
                    className={`mt-2 flex h-20 w-20 items-center justify-center rounded-full bg-white/10 text-2xl font-bold ${avatarRing(1)}`}
                  >
                    {top3[0].avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={top3[0].avatar_url}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      (top3[0].display_name?.charAt(0) ?? '?').toUpperCase()
                    )}
                  </div>
                  <p className="mt-2 truncate text-sm font-medium text-white">
                    {top3[0].display_name}
                  </p>
                  <p className="text-lg font-bold">{formatCurrency(top3[0].net_worth)}</p>
                </motion.div>
              )}
              {top3[2] && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className={`flex w-1/3 flex-col items-center rounded-xl border bg-white/[0.03] p-4 backdrop-blur-md ${rankStyle(3)}`}
                >
                  <span className="text-2xl font-bold">3</span>
                  <div
                    className={`mt-2 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 text-xl font-bold ${avatarRing(3)}`}
                  >
                    {top3[2].avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={top3[2].avatar_url}
                        alt=""
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      (top3[2].display_name?.charAt(0) ?? '?').toUpperCase()
                    )}
                  </div>
                  <p className="mt-2 truncate text-sm font-medium text-white">
                    {top3[2].display_name}
                  </p>
                  <p className="text-sm font-semibold">{formatCurrency(top3[2].net_worth)}</p>
                </motion.div>
              )}
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={CARD_STYLE}
          >
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-sm text-zinc-400">
                    <th className="pb-3 font-medium w-16">Rank</th>
                    <th className="pb-3 font-medium">Player</th>
                    <th className="pb-3 font-medium">Net Worth</th>
                    <th className="pb-3 font-medium">P&L %</th>
                    <th className="pb-3 font-medium">Trades</th>
                    <th className="pb-3 font-medium">Achievements</th>
                  </tr>
                </thead>
                <tbody>
                  {traders.map((t, i) => {
                    const rank = i + 1
                    const isCurrentUser = t.id === currentUserId
                    return (
                      <motion.tr
                        key={t.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.25 + i * 0.02 }}
                        className={`border-b border-white/[0.04] transition-colors hover:bg-white/[0.03] ${
                          isCurrentUser ? 'ring-1 ring-[#00ff88]/50 ring-inset' : ''
                        }`}
                      >
                        <td className="py-3">
                          {rank <= 3 ? (
                            <span
                              className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-sm font-bold ${
                                rank === 1
                                  ? 'bg-amber-500/20 text-amber-400'
                                  : rank === 2
                                    ? 'bg-zinc-400/20 text-zinc-300'
                                    : 'bg-amber-700/20 text-amber-600'
                              }`}
                            >
                              {rank === 1 && <Medal className="h-4 w-4" />}
                              {rank}
                            </span>
                          ) : (
                            <span className="text-zinc-500">{rank}</span>
                          )}
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-medium text-white">
                              {t.avatar_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img
                                  src={t.avatar_url}
                                  alt=""
                                  className="h-full w-full rounded-full object-cover"
                                />
                              ) : (
                                t.display_name?.charAt(0)?.toUpperCase() ?? '?'
                              )}
                            </div>
                            <span className="font-medium text-white">
                              {t.display_name}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 font-medium text-white">
                          {formatCurrency(t.net_worth)}
                        </td>
                        <td
                          className={`py-3 font-medium ${
                            t.pnl_pct >= 0 ? 'text-[#00ff88]' : 'text-red-400'
                          }`}
                        >
                          {t.pnl_pct >= 0 ? '+' : ''}
                          {t.pnl_pct.toFixed(1)}%
                        </td>
                        <td className="py-3 text-zinc-400">{t.trades}</td>
                        <td className="py-3 text-zinc-400">{t.achievements}</td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}

      {tab === 'funds' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {funds.map((f, i) => (
            <motion.div
              key={f.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`rounded-xl border bg-white/[0.03] p-5 backdrop-blur-md ${
                f.rank === 1
                  ? 'border-amber-500/30 shadow-[0_0_20px_-5px_rgba(251,191,36,0.2)]'
                  : f.rank === 2
                    ? 'border-zinc-400/30 shadow-[0_0_20px_-5px_rgba(161,161,170,0.2)]'
                    : f.rank === 3
                      ? 'border-amber-700/30 shadow-[0_0_20px_-5px_rgba(180,83,9,0.2)]'
                      : 'border-white/[0.08]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`text-lg font-bold ${
                    f.rank === 1
                      ? 'text-amber-400'
                      : f.rank === 2
                        ? 'text-zinc-300'
                        : f.rank === 3
                          ? 'text-amber-600'
                          : 'text-zinc-500'
                  }`}
                >
                  #{f.rank}
                </span>
                <span className="text-xs text-zinc-500">{f.member_count} members</span>
              </div>
              <h3 className="mt-2 font-semibold text-white">{f.name}</h3>
              <p className="text-sm text-zinc-400">by {f.manager_name}</p>
              <p className="mt-2 text-lg font-bold text-white">
                {formatCurrency(f.total_value)}
              </p>
              <p
                className={`text-sm font-medium ${
                  f.roi >= 0 ? 'text-[#00ff88]' : 'text-red-400'
                }`}
              >
                {f.roi >= 0 ? '+' : ''}
                {f.roi.toFixed(1)}% ROI
              </p>
            </motion.div>
          ))}
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-white/[0.08] bg-[#0a0a0f]/95 px-6 py-4 backdrop-blur-md lg:left-[240px]"
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <span className="text-sm text-zinc-400">Your Rank</span>
          <div className="flex items-center gap-4">
            <span className="font-bold text-white">
              #{currentUserRank}
              <span className="ml-1 font-normal text-zinc-500">
                of {totalPlayers} players
              </span>
            </span>
            <span className="text-[#00ff88] font-semibold">
              {formatCurrency(currentUserNetWorth)}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
