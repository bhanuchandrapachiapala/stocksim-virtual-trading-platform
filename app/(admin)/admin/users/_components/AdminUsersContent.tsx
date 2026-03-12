'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, DollarSign, X } from 'lucide-react'
import { ADMIN_GRANT_AMOUNT } from '@/lib/constants'

const RED = '#ef4444'
const CARD =
  'rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md'

type UserRow = {
  id: string
  display_name: string
  email: string
  avatar_url: string | null
  cash_balance: number
  is_bankrupt: boolean
  created_at: string
  net_worth: number
  trades_count: number
  has_active_loan: boolean
}

type AdminUsersContentProps = { users: UserRow[] }

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

export function AdminUsersContent({ users: initialUsers }: AdminUsersContentProps) {
  const [search, setSearch] = useState('')
  const [grantUserId, setGrantUserId] = useState<string | null>(null)
  const [grantAmount, setGrantAmount] = useState(String(ADMIN_GRANT_AMOUNT))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = search.trim()
    ? initialUsers.filter(
        (u) =>
          u.display_name?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase())
      )
    : initialUsers

  async function handleGrant() {
    if (!grantUserId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: grantUserId,
          amount: parseFloat(grantAmount) || ADMIN_GRANT_AMOUNT,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Grant failed')
      setGrantUserId(null)
      setGrantAmount(String(ADMIN_GRANT_AMOUNT))
      window.location.reload()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Grant failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Users className="h-8 w-8" style={{ color: RED }} />
        <h1 className="text-2xl font-bold text-white">Admin Users</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name or email..."
          className="w-full rounded-lg border border-white/10 bg-black/30 py-2 pl-10 pr-4 text-white placeholder-zinc-500 focus:border-[#ef4444] focus:outline-none focus:ring-1 focus:ring-[#ef4444]"
        />
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={CARD}
      >
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-zinc-400">
                <th className="pb-3 pr-3 font-medium">User</th>
                <th className="pb-3 pr-3 font-medium">Email</th>
                <th className="pb-3 pr-3 font-medium">Cash</th>
                <th className="pb-3 pr-3 font-medium">Net Worth</th>
                <th className="pb-3 pr-3 font-medium">Active Loan</th>
                <th className="pb-3 pr-3 font-medium">Trades</th>
                <th className="pb-3 pr-3 font-medium">Joined</th>
                <th className="pb-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.02 }}
                  className="border-b border-white/5 text-zinc-300"
                >
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-2">
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-sm font-medium text-white"
                          style={{ backgroundColor: 'rgba(239,68,68,0.2)' }}
                        >
                          {(u.display_name || u.email || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                      <span className="font-medium text-white">
                        {u.display_name || u.email || '—'}
                      </span>
                      {u.is_bankrupt && (
                        <span className="rounded bg-red-500/20 px-1.5 py-0.5 text-xs text-red-400">
                          Bankrupt
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 pr-3 text-zinc-400">{u.email}</td>
                  <td className="py-3 pr-3">{formatCurrency(u.cash_balance ?? 0)}</td>
                  <td className="py-3 pr-3">{formatCurrency(u.net_worth)}</td>
                  <td className="py-3 pr-3">
                    {u.has_active_loan ? (
                      <span className="text-amber-400">Yes</span>
                    ) : (
                      <span className="text-zinc-500">No</span>
                    )}
                  </td>
                  <td className="py-3 pr-3">{u.trades_count}</td>
                  <td className="py-3 pr-3">{new Date(u.created_at).toLocaleDateString()}</td>
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setGrantUserId(u.id)
                        setGrantAmount(String(ADMIN_GRANT_AMOUNT))
                      }}
                      className="flex items-center gap-1 rounded border border-[#ef4444]/50 bg-[#ef4444]/10 px-2 py-1 text-xs font-medium text-[#ef4444] hover:bg-[#ef4444]/20"
                    >
                      <DollarSign className="h-3 w-3" />
                      Grant Funds
                    </button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
        {filtered.length === 0 && (
          <p className="py-8 text-center text-zinc-500">No users match your search.</p>
        )}
      </motion.div>

      <AnimatePresence>
        {grantUserId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setGrantUserId(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-xl border border-white/10 bg-[#111118] p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Grant Funds</h3>
                <button
                  type="button"
                  onClick={() => setGrantUserId(null)}
                  className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-zinc-400">Amount ($)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={grantAmount}
                    onChange={(e) => setGrantAmount(e.target.value)}
                    className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white focus:border-[#ef4444] focus:outline-none focus:ring-1 focus:ring-[#ef4444]"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleGrant}
                    disabled={loading}
                    className="flex-1 rounded-lg bg-[#ef4444] py-2 text-sm font-medium text-white hover:bg-[#ef4444]/90 disabled:opacity-50"
                  >
                    {loading ? 'Granting...' : 'Grant'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setGrantUserId(null)}
                    className="rounded-lg border border-white/10 py-2 px-4 text-sm text-zinc-400 hover:bg-white/5"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
