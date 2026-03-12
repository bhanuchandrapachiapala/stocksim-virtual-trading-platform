'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const CARD_STYLE =
  'rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md'

export default function CreateFundPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [minBuyIn, setMinBuyIn] = useState('100')
  const [feePercent, setFeePercent] = useState('1')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const minBuyInNum = parseFloat(minBuyIn) || 0
  const feeNum = parseFloat(feePercent) || 0

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (!name.trim()) {
      setError('Fund name is required')
      return
    }
    if (minBuyInNum < 0) {
      setError('Minimum buy-in must be non-negative')
      return
    }
    if (feeNum < 0 || feeNum > 5) {
      setError('Fee must be between 0 and 5%')
      return
    }
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/funds/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
          min_buy_in: minBuyInNum,
          fee_percent: feeNum,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Failed to create fund')
      router.push(`/funds/${data.fund?.id ?? ''}`)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create fund')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-white">Create a Fund</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        <div className={CARD_STYLE}>
          <label className="block text-sm font-medium text-zinc-400">
            Fund name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Growth Alpha"
            className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-white placeholder-zinc-500 focus:border-[#00ff88] focus:outline-none focus:ring-1 focus:ring-[#00ff88]"
            required
          />
        </div>

        <div className={CARD_STYLE}>
          <label className="block text-sm font-medium text-zinc-400">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your fund strategy..."
            rows={4}
            className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-white placeholder-zinc-500 focus:border-[#00ff88] focus:outline-none focus:ring-1 focus:ring-[#00ff88]"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className={CARD_STYLE}>
            <label className="block text-sm font-medium text-zinc-400">
              Minimum buy-in ($)
            </label>
            <input
              type="number"
              min={0}
              step={1}
              value={minBuyIn}
              onChange={(e) => setMinBuyIn(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none focus:ring-1 focus:ring-[#00ff88]"
            />
          </div>
          <div className={CARD_STYLE}>
            <label className="block text-sm font-medium text-zinc-400">
              Management fee (%)
            </label>
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={feePercent}
              onChange={(e) => setFeePercent(e.target.value)}
              className="mt-1 w-full rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 py-2.5 text-white focus:border-[#00ff88] focus:outline-none focus:ring-1 focus:ring-[#00ff88]"
            />
            <p className="mt-0.5 text-xs text-zinc-500">0–5%</p>
          </div>
        </div>

        <div className={CARD_STYLE}>
          <p className="text-sm font-medium text-zinc-400">Preview</p>
          <div className="mt-2 rounded-lg border border-white/[0.06] bg-white/[0.02] p-4">
            <p className="font-semibold text-white">{name || 'Fund name'}</p>
            <p className="mt-1 text-sm text-zinc-500">
              {description || 'No description.'}
            </p>
            <p className="mt-2 text-sm text-zinc-400">
              Min buy-in: {formatCurrency(minBuyInNum)} • Fee: {feeNum}%
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting || !name.trim()}
          className="w-full rounded-lg bg-[#00ff88]/20 py-3 font-semibold text-[#00ff88] transition-colors hover:bg-[#00ff88]/30 disabled:pointer-events-none disabled:opacity-50"
        >
          {isSubmitting ? 'Creating…' : 'Create Fund'}
        </button>
      </form>
    </div>
  )
}
