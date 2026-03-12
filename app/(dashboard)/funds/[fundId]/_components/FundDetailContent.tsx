'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'

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

type FundDetailContentProps = {
  fund: {
    id: string
    name: string
    description: string
    manager_id: string
    manager_name: string
    total_value: number
    fee_percent: number
    min_buy_in: number
    roi: number
  }
  holdings: Array<{
    id: string
    company_id: string
    quantity: number
    avg_buy_price: number
    company_name: string
    ticker: string
    current_price: number
    value: number
    pnl_pct: number
  }>
  members: Array<{
    id: string
    user_id: string
    contribution: number
    joined_at: string
    display_name: string
    current_value: number
    roi: number
  }>
  myMembership: { id: string; contribution: number } | null
  isManager: boolean
  isMember: boolean
  companies: Array<{ id: string; name: string; ticker: string; current_price: number }>
}

export function FundDetailContent({
  fund,
  holdings,
  members,
  myMembership,
  isManager,
  isMember,
  companies,
}: FundDetailContentProps) {
  const router = useRouter()
  const [joinAmount, setJoinAmount] = useState('')
  const [tradeSide, setTradeSide] = useState<'buy' | 'sell'>('buy')
  const [tradeCompanyId, setTradeCompanyId] = useState('')
  const [tradeQuantity, setTradeQuantity] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [isExiting, setIsExiting] = useState(false)
  const [isTrading, setIsTrading] = useState(false)

  const joinNum = parseFloat(joinAmount) || 0
  const canJoin = isMember === false && joinNum >= fund.min_buy_in
  const qtyNum = parseInt(tradeQuantity, 10) || 0
  const selectedCompany = companies.find((c) => c.id === tradeCompanyId)
  const tradeCost = selectedCompany && qtyNum > 0 ? qtyNum * selectedCompany.current_price : 0
  const companiesForSell = companies.filter((c) =>
    holdings.some((h) => h.company_id === c.id)
  )
  const tradeCompanyList = tradeSide === 'sell' ? companiesForSell : companies

  const handleJoin = async () => {
    if (!canJoin) return
    setIsJoining(true)
    try {
      const res = await fetch('/api/funds/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fund_id: fund.id, amount: joinNum }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Join failed')
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Join failed')
    } finally {
      setIsJoining(false)
    }
  }

  const handleExit = async () => {
    if (!isMember || isManager) return
    if (!confirm('Exit this fund? You will receive your proportional share.')) return
    setIsExiting(true)
    try {
      const res = await fetch('/api/funds/exit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fund_id: fund.id }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Exit failed')
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Exit failed')
    } finally {
      setIsExiting(false)
    }
  }

  const handleTrade = async () => {
    if (!tradeCompanyId || qtyNum < 1) return
    setIsTrading(true)
    try {
      const res = await fetch('/api/funds/trade', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fund_id: fund.id,
          company_id: tradeCompanyId,
          side: tradeSide,
          quantity: qtyNum,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Trade failed')
      setTradeQuantity('')
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Trade failed')
    } finally {
      setIsTrading(false)
    }
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap items-start justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-white">{fund.name}</h1>
          <p className="text-zinc-400">by {fund.manager_name}</p>
          <p className="mt-2 text-zinc-500">{fund.description || 'No description.'}</p>
          <div className="mt-3 flex items-center gap-4">
            <span className="text-xl font-semibold text-white">
              {formatCurrency(fund.total_value)}
            </span>
            <span
              className={`rounded px-2 py-0.5 text-sm font-medium ${
                fund.roi >= 0 ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'bg-red-500/20 text-red-400'
              }`}
            >
              {fund.roi >= 0 ? '+' : ''}
              {fund.roi.toFixed(1)}% ROI
            </span>
            <span className="text-sm text-zinc-500">{fund.fee_percent}% fee</span>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`${CARD_STYLE} lg:col-span-2`}
        >
          <h2 className="mb-4 font-semibold text-white">Fund Holdings</h2>
          {holdings.length === 0 ? (
            <p className="text-sm text-zinc-500">No holdings yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[500px]">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-sm text-zinc-400">
                    <th className="pb-2 font-medium">Company</th>
                    <th className="pb-2 font-medium">Ticker</th>
                    <th className="pb-2 font-medium">Shares</th>
                    <th className="pb-2 font-medium">Avg Buy</th>
                    <th className="pb-2 font-medium">Current</th>
                    <th className="pb-2 font-medium">Value</th>
                    <th className="pb-2 font-medium">P&L%</th>
                  </tr>
                </thead>
                <tbody>
                  {holdings.map((h) => (
                    <tr key={h.id} className="border-b border-white/[0.04] text-sm">
                      <td className="py-2 text-white">{h.company_name}</td>
                      <td className="py-2 font-mono text-zinc-400">{h.ticker}</td>
                      <td className="py-2 text-white">{h.quantity.toLocaleString()}</td>
                      <td className="py-2 text-zinc-400">
                        {formatCurrency(h.avg_buy_price)}
                      </td>
                      <td className="py-2 text-white">
                        {formatCurrency(h.current_price)}
                      </td>
                      <td className="py-2 text-white">{formatCurrency(h.value)}</td>
                      <td
                        className={`py-2 font-medium ${
                          h.pnl_pct >= 0 ? 'text-[#00ff88]' : 'text-red-400'
                        }`}
                      >
                        {h.pnl_pct >= 0 ? '+' : ''}
                        {h.pnl_pct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={CARD_STYLE}
        >
          <h2 className="mb-4 font-semibold text-white">Members</h2>
          <ul className="space-y-3">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2"
              >
                <div>
                  <p className="font-medium text-white">{m.display_name}</p>
                  <p className="text-xs text-zinc-500">
                    Contributed: {formatCurrency(m.contribution)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-white">
                    {formatCurrency(m.current_value)}
                  </p>
                  <p
                    className={`text-xs ${
                      m.roi >= 0 ? 'text-[#00ff88]' : 'text-red-400'
                    }`}
                  >
                    {m.roi >= 0 ? '+' : ''}
                    {m.roi.toFixed(1)}%
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {isManager && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={CARD_STYLE}
        >
          <h2 className="mb-4 font-semibold text-white">Manager Trade</h2>
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setTradeSide('buy')}
                className={`rounded px-3 py-1.5 text-sm font-medium ${
                  tradeSide === 'buy'
                    ? 'bg-[#00ff88]/20 text-[#00ff88]'
                    : 'text-zinc-400 hover:bg-white/5'
                }`}
              >
                Buy
              </button>
              <button
                type="button"
                onClick={() => setTradeSide('sell')}
                className={`rounded px-3 py-1.5 text-sm font-medium ${
                  tradeSide === 'sell'
                    ? 'bg-red-500/20 text-red-400'
                    : 'text-zinc-400 hover:bg-white/5'
                }`}
              >
                Sell
              </button>
            </div>
            <div>
              <label className="block text-xs text-zinc-500">Company</label>
              <select
                value={tradeCompanyId}
                onChange={(e) => setTradeCompanyId(e.target.value)}
                className="mt-1 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-white focus:border-[#00ff88] focus:outline-none focus:ring-1 focus:ring-[#00ff88]"
              >
                <option value="">Select...</option>
                {tradeCompanyList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.ticker} - {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-zinc-500">Quantity</label>
              <input
                type="number"
                min={1}
                value={tradeQuantity}
                onChange={(e) => setTradeQuantity(e.target.value.replace(/\D/g, ''))}
                className="mt-1 w-24 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-white focus:border-[#00ff88] focus:outline-none focus:ring-1 focus:ring-[#00ff88]"
              />
            </div>
            {qtyNum > 0 && selectedCompany && (
              <p className="text-sm text-zinc-400">
                Total: {formatCurrency(tradeCost)}
              </p>
            )}
            <button
              type="button"
              onClick={handleTrade}
              disabled={!tradeCompanyId || qtyNum < 1 || isTrading}
              className={`rounded-lg px-4 py-2 font-medium disabled:opacity-50 ${
                tradeSide === 'buy'
                  ? 'bg-[#00ff88]/20 text-[#00ff88] hover:bg-[#00ff88]/30'
                  : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              }`}
            >
              {isTrading ? 'Processing…' : 'Execute Trade'}
            </button>
          </div>
        </motion.div>
      )}

      {!isMember && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className={CARD_STYLE}
        >
          <h2 className="mb-4 font-semibold text-white">Join Fund</h2>
          <p className="text-sm text-zinc-400">
            Minimum buy-in: {formatCurrency(fund.min_buy_in)}
          </p>
          <div className="mt-3 flex flex-wrap items-end gap-3">
            <div>
              <label className="block text-xs text-zinc-500">Amount</label>
              <input
                type="number"
                min={fund.min_buy_in}
                step={1}
                value={joinAmount}
                onChange={(e) => setJoinAmount(e.target.value)}
                className="mt-1 w-40 rounded-lg border border-white/[0.08] bg-white/[0.04] px-3 py-2 text-white focus:border-[#00ff88] focus:outline-none focus:ring-1 focus:ring-[#00ff88]"
              />
            </div>
            <button
              type="button"
              onClick={handleJoin}
              disabled={!canJoin || isJoining}
              className="rounded-lg bg-[#00ff88]/20 px-4 py-2 font-medium text-[#00ff88] hover:bg-[#00ff88]/30 disabled:pointer-events-none disabled:opacity-50"
            >
              {isJoining ? 'Joining…' : 'Join'}
            </button>
          </div>
        </motion.div>
      )}

      {isMember && !isManager && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <button
            type="button"
            onClick={handleExit}
            disabled={isExiting}
            className="rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-50"
          >
            {isExiting ? 'Exiting…' : 'Exit Fund'}
          </button>
        </motion.div>
      )}
    </div>
  )
}
