'use client'

import { motion } from 'framer-motion'
import { Shield, Users, ClipboardList, Landmark, Building2, Newspaper, UsersRound } from 'lucide-react'

const CARD_STYLE =
  'rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md'

const RED = '#ef4444'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

type AdminOverviewContentProps = {
  stats: {
    users: number
    trades: number
    activeLoans: number
    companies: number
    news: number
    funds: number
  }
  recentTrades: Array<{
    id: string
    user_id: string
    quantity: number
    price: number
    created_at: string
    companies: { ticker: string } | null
    users: { display_name: string } | null
  }>
  recentUsers: Array<{
    id: string
    display_name: string
    email: string
    created_at: string
  }>
}

export function AdminOverviewContent({
  stats,
  recentTrades,
  recentUsers,
}: AdminOverviewContentProps) {
  const statItems = [
    { label: 'Total Users', value: stats.users, icon: Users },
    { label: 'Total Trades', value: stats.trades, icon: ClipboardList },
    { label: 'Active Loans', value: stats.activeLoans, icon: Landmark },
    { label: 'Companies', value: stats.companies, icon: Building2 },
    { label: 'News Articles', value: stats.news, icon: Newspaper },
    { label: 'Funds', value: stats.funds, icon: UsersRound },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Shield className="h-8 w-8" style={{ color: RED }} />
        <h1 className="text-2xl font-bold text-white">Admin Overview</h1>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {statItems.map((item, i) => (
          <motion.div
            key={item.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className={CARD_STYLE}
          >
            <div className="flex items-center gap-2">
              <item.icon className="h-5 w-5" style={{ color: RED }} />
              <p className="text-sm font-medium text-zinc-400">{item.label}</p>
            </div>
            <p className="mt-1 text-2xl font-bold text-white">{item.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={CARD_STYLE}
        >
          <h2 className="mb-4 font-semibold text-white">Recent Trades</h2>
          {recentTrades.length === 0 ? (
            <p className="text-sm text-zinc-500">No trades yet</p>
          ) : (
            <ul className="space-y-2">
              {recentTrades.map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2 text-sm"
                >
                  <span className="text-white">
                    {t.users?.display_name ?? 'User'} · {t.companies?.ticker ?? '—'}
                  </span>
                  <span className="text-zinc-400">
                    {t.quantity} @ {formatCurrency(t.price)}
                  </span>
                  <span className="text-zinc-500">
                    {new Date(t.created_at).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className={CARD_STYLE}
        >
          <h2 className="mb-4 font-semibold text-white">New Users</h2>
          {recentUsers.length === 0 ? (
            <p className="text-sm text-zinc-500">No users yet</p>
          ) : (
            <ul className="space-y-2">
              {recentUsers.map((u) => (
                <li
                  key={u.id}
                  className="flex items-center justify-between rounded-lg border border-white/[0.06] px-3 py-2 text-sm"
                >
                  <span className="font-medium text-white">
                    {u.display_name || u.email}
                  </span>
                  <span className="text-zinc-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </motion.div>
      </div>
    </div>
  )
}
