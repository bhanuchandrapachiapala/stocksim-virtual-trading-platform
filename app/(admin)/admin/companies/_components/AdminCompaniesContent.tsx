'use client'

import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Building2, ArrowUpDown } from 'lucide-react'

const RED = '#ef4444'
const CARD =
  'rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md'

const SECTORS = [
  'Technology',
  'Finance',
  'Healthcare',
  'Energy',
  'Consumer',
  'Industrial',
  'Other',
]

type Company = {
  id: string
  name: string
  ticker: string
  sector: string
  current_price: number
  shares_available: number
  created_at: string
}

type AdminCompaniesContentProps = { companies: Company[] }

function formatCurrency(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

export function AdminCompaniesContent({ companies: initialCompanies }: AdminCompaniesContentProps) {
  const [companies, setCompanies] = useState(initialCompanies)
  const [name, setName] = useState('')
  const [ticker, setTicker] = useState('')
  const [sector, setSector] = useState(SECTORS[0])
  const [description, setDescription] = useState('')
  const [currentPrice, setCurrentPrice] = useState('')
  const [sharesOutstanding, setSharesOutstanding] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<'price' | 'name' | null>(null)
  const [sortAsc, setSortAsc] = useState(true)

  const sortedCompanies = useMemo(() => {
    if (!sortKey) return companies
    const copy = [...companies]
    copy.sort((a, b) => {
      if (sortKey === 'price') {
        return sortAsc ? a.current_price - b.current_price : b.current_price - a.current_price
      }
      return sortAsc
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    })
    return copy
  }, [companies, sortKey, sortAsc])

  async function handleAdd() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          ticker: ticker.trim().toUpperCase(),
          sector,
          description: description.trim(),
          current_price: parseFloat(currentPrice) || 0,
          shares_outstanding: parseInt(sharesOutstanding, 10) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to add company')
      setCompanies((prev) => [
        {
          id: data.company.id,
          name: data.company.name,
          ticker: data.company.ticker,
          sector: data.company.sector,
          current_price: data.company.current_price,
          shares_available: data.company.shares_available,
          created_at: data.company.created_at,
        },
        ...prev,
      ])
      setName('')
      setTicker('')
      setSector(SECTORS[0])
      setDescription('')
      setCurrentPrice('')
      setSharesOutstanding('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to add company')
    } finally {
      setLoading(false)
    }
  }

  const priceNum = parseFloat(currentPrice) || 0
  const sharesNum = parseInt(sharesOutstanding, 10) || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="h-8 w-8" style={{ color: RED }} />
        <h1 className="text-2xl font-bold text-white">Admin Companies</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={CARD}
        >
          <h2 className="mb-4 font-semibold text-white">Add New Company</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white placeholder-zinc-500 focus:border-[#ef4444] focus:outline-none focus:ring-1 focus:ring-[#ef4444]"
                placeholder="Company name"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Ticker (auto uppercase)</label>
              <input
                value={ticker}
                onChange={(e) => setTicker(e.target.value.toUpperCase())}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white placeholder-zinc-500 focus:border-[#ef4444] focus:outline-none focus:ring-1 focus:ring-[#ef4444]"
                placeholder="AAPL"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Sector</label>
              <select
                value={sector}
                onChange={(e) => setSector(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white focus:border-[#ef4444] focus:outline-none focus:ring-1 focus:ring-[#ef4444]"
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s} className="bg-zinc-900">
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white placeholder-zinc-500 focus:border-[#ef4444] focus:outline-none focus:ring-1 focus:ring-[#ef4444]"
                placeholder="Brief description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Starting Price</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={currentPrice}
                  onChange={(e) => setCurrentPrice(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white focus:border-[#ef4444] focus:outline-none focus:ring-1 focus:ring-[#ef4444]"
                  placeholder="100.00"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-zinc-400">Shares Outstanding</label>
                <input
                  type="number"
                  min="1"
                  value={sharesOutstanding}
                  onChange={(e) => setSharesOutstanding(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white focus:border-[#ef4444] focus:outline-none focus:ring-1 focus:ring-[#ef4444]"
                  placeholder="1000000"
                />
              </div>
            </div>
            {name && ticker && (
              <div className="rounded-lg border border-white/10 bg-black/20 p-3">
                <p className="text-xs text-zinc-500">Preview</p>
                <p className="font-medium text-white">{name}</p>
                <span className="inline-block mt-1 rounded bg-[#ef4444]/20 px-2 py-0.5 text-xs text-[#ef4444]">
                  {ticker.toUpperCase()}
                </span>
                <span className="ml-2 rounded bg-white/10 px-2 py-0.5 text-xs text-zinc-400">
                  {sector}
                </span>
                <p className="mt-1 text-sm text-zinc-400">
                  {formatCurrency(priceNum)} · {sharesNum.toLocaleString()} shares
                </p>
              </div>
            )}
            <button
              type="button"
              onClick={handleAdd}
              disabled={loading || !name.trim() || !ticker.trim() || !currentPrice || !sharesOutstanding}
              className="w-full rounded-lg bg-[#ef4444] py-2 text-sm font-medium text-white hover:bg-[#ef4444]/90 disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Company'}
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={CARD}
        >
          <h2 className="mb-4 font-semibold text-white">Existing Companies</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-zinc-400">
                  <th className="pb-2 pr-2 font-medium">Name</th>
                  <th className="pb-2 pr-2 font-medium">Ticker</th>
                  <th className="pb-2 pr-2 font-medium">Sector</th>
                  <th className="pb-2 pr-2 font-medium">
                    <button
                      type="button"
                      onClick={() => {
                        if (sortKey === 'price') setSortAsc((a) => !a)
                        else { setSortKey('price'); setSortAsc(true) }
                      }}
                      className="flex items-center gap-1 hover:text-white"
                    >
                      Price <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </th>
                  <th className="pb-2 pr-2 font-medium">Shares Avail.</th>
                  <th className="pb-2 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {sortedCompanies.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="border-b border-white/5 text-zinc-300"
                  >
                    <td className="py-2 pr-2 font-medium text-white">{c.name}</td>
                    <td className="py-2 pr-2">{c.ticker}</td>
                    <td className="py-2 pr-2">{c.sector}</td>
                    <td className="py-2 pr-2">{formatCurrency(c.current_price)}</td>
                    <td className="py-2 pr-2">{c.shares_available.toLocaleString()}</td>
                    <td className="py-2">{new Date(c.created_at).toLocaleDateString()}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
            {sortedCompanies.length === 0 && (
              <p className="py-6 text-center text-zinc-500">No companies yet.</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  )
}
