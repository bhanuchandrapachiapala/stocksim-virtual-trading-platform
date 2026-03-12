'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { ClipboardList, XCircle } from 'lucide-react'

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

type OrderRow = {
  id: string
  company_id: string
  side: string
  order_type: string
  quantity: number
  price: number
  status: string
  created_at: string
  executed_at: string | null
  companies: { name: string; ticker: string; current_price: number } | null
}

type OrdersContentProps = {
  openOrders: OrderRow[]
  orderHistory: OrderRow[]
}

export function OrdersContent({ openOrders, orderHistory }: OrdersContentProps) {
  const router = useRouter()
  const [tab, setTab] = useState<'open' | 'history'>('open')
  const [cancellingId, setCancellingId] = useState<string | null>(null)

  const handleCancel = async (orderId: string) => {
    setCancellingId(orderId)
    try {
      const res = await fetch('/api/orders/limit/cancel', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Cancel failed')
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Cancel failed')
    } finally {
      setCancellingId(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ClipboardList className="h-8 w-8 text-[#00ff88]" />
        <h1 className="text-2xl font-bold text-white">Orders</h1>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('open')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'open'
              ? 'bg-[#00ff88]/20 text-[#00ff88]'
              : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-300'
          }`}
        >
          Open Orders
        </button>
        <button
          type="button"
          onClick={() => setTab('history')}
          className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            tab === 'history'
              ? 'bg-[#00ff88]/20 text-[#00ff88]'
              : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-300'
          }`}
        >
          Order History
        </button>
      </div>

      {tab === 'open' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={CARD_STYLE}
        >
          {openOrders.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-zinc-500">
              <XCircle className="h-12 w-12" />
              <p className="mt-3">No open orders</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">
                <thead>
                  <tr className="border-b border-white/[0.06] text-left text-sm text-zinc-400">
                    <th className="pb-3 font-medium">Company</th>
                    <th className="pb-3 font-medium">Ticker</th>
                    <th className="pb-3 font-medium">Side</th>
                    <th className="pb-3 font-medium">Qty</th>
                    <th className="pb-3 font-medium">Limit Price</th>
                    <th className="pb-3 font-medium">Current</th>
                    <th className="pb-3 font-medium">Distance %</th>
                    <th className="pb-3 font-medium">Placed At</th>
                    <th className="pb-3 font-medium w-24" />
                  </tr>
                </thead>
                <tbody>
                  {openOrders.map((o) => {
                    const cur = o.companies?.current_price ?? o.price
                    const distancePct =
                      o.price > 0 ? ((cur - o.price) / o.price) * 100 : 0
                    return (
                      <tr
                        key={o.id}
                        className="border-b border-white/[0.04] text-sm"
                      >
                        <td className="py-3 text-white">{o.companies?.name ?? '—'}</td>
                        <td className="py-3 font-mono text-zinc-400">
                          {o.companies?.ticker ?? '—'}
                        </td>
                        <td className="py-3">
                          <span
                            className={`rounded px-2 py-0.5 text-xs font-medium ${
                              o.side === 'buy' ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {o.side === 'buy' ? 'Buy' : 'Sell'}
                          </span>
                        </td>
                        <td className="py-3 text-white">{o.quantity}</td>
                        <td className="py-3 text-zinc-300">
                          {formatCurrency(o.price)}
                        </td>
                        <td className="py-3 text-zinc-300">
                          {formatCurrency(cur)}
                        </td>
                        <td
                          className={`py-3 font-medium ${
                            distancePct >= 0 ? 'text-[#00ff88]' : 'text-red-400'
                          }`}
                        >
                          {distancePct >= 0 ? '+' : ''}
                          {distancePct.toFixed(1)}%
                        </td>
                        <td className="py-3 text-zinc-500">
                          {new Date(o.created_at).toLocaleString()}
                        </td>
                        <td className="py-3">
                          <button
                            type="button"
                            onClick={() => handleCancel(o.id)}
                            disabled={cancellingId === o.id}
                            className="rounded border border-red-500/50 px-2 py-1 text-xs text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            {cancellingId === o.id ? 'Cancelling…' : 'Cancel'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}

      {tab === 'history' && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className={CARD_STYLE}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px]">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-sm text-zinc-400">
                  <th className="pb-3 font-medium">Company</th>
                  <th className="pb-3 font-medium">Ticker</th>
                  <th className="pb-3 font-medium">Side</th>
                  <th className="pb-3 font-medium">Type</th>
                  <th className="pb-3 font-medium">Qty</th>
                  <th className="pb-3 font-medium">Price</th>
                  <th className="pb-3 font-medium">Total</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {orderHistory.map((o, i) => (
                  <motion.tr
                    key={o.id}
                    initial={{ opacity: 0, x: -4 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-white/[0.04] text-sm"
                  >
                    <td className="py-3 text-white">{o.companies?.name ?? '—'}</td>
                    <td className="py-3 font-mono text-zinc-400">
                      {o.companies?.ticker ?? '—'}
                    </td>
                    <td className="py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          o.side === 'buy' ? 'bg-[#00ff88]/20 text-[#00ff88]' : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {o.side === 'buy' ? 'Buy' : 'Sell'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          o.order_type === 'market' ? 'bg-blue-500/20 text-blue-400' : 'bg-violet-500/20 text-violet-400'
                        }`}
                      >
                        {o.order_type === 'market' ? 'Market' : 'Limit'}
                      </span>
                    </td>
                    <td className="py-3 text-white">{o.quantity}</td>
                    <td className="py-3 text-zinc-300">
                      {formatCurrency(o.price)}
                    </td>
                    <td className="py-3 text-zinc-300">
                      {formatCurrency(o.quantity * o.price)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          o.status === 'executed'
                            ? 'bg-[#00ff88]/20 text-[#00ff88]'
                            : 'bg-zinc-500/20 text-zinc-400'
                        }`}
                      >
                        {o.status}
                      </span>
                    </td>
                    <td className="py-3 text-zinc-500">
                      {new Date(o.executed_at ?? o.created_at).toLocaleString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
          {orderHistory.length === 0 && (
            <p className="py-8 text-center text-sm text-zinc-500">No order history</p>
          )}
        </motion.div>
      )}
    </div>
  )
}
