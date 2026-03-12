'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Landmark, AlertTriangle } from 'lucide-react'

const CARD_STYLE =
  'rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md'

const LOAN_INTEREST_RATE = 5
const LOAN_DURATION_DAYS = 30

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

type LoanRow = {
  id: string
  principal: number
  interest_rate: number
  amount_owed: number
  repaid_amount: number
  due_date: string
  status: string
  created_at: string
}

type BankContentProps = {
  netWorth: number
  maxLoanEligible: number
  activeLoan: LoanRow | null
  amountBorrowed: number
  daysRemaining: number | null
  loans: LoanRow[]
  cashBalance: number
}

export function BankContent({
  netWorth,
  maxLoanEligible,
  activeLoan,
  loans,
  cashBalance,
}: BankContentProps) {
  const router = useRouter()
  const [repayAmount, setRepayAmount] = useState('')
  const [loanAmount, setLoanAmount] = useState(100)
  const [isRepaying, setIsRepaying] = useState(false)
  const [isApplying, setIsApplying] = useState(false)
  const [countdown, setCountdown] = useState<string | null>(null)

  const dueDate = activeLoan ? new Date(activeLoan.due_date) : null

  useEffect(() => {
    if (!dueDate) return
    const tick = () => {
      const now = new Date()
      if (now >= dueDate) {
        setCountdown('0d 0h 0m')
        return
      }
      const ms = dueDate.getTime() - now.getTime()
      const d = Math.floor(ms / (1000 * 60 * 60 * 24))
      const h = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const m = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
      setCountdown(`${d}d ${h}h ${m}m`)
    }
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [dueDate?.toISOString()])

  const repayNum = parseFloat(repayAmount) || 0
  const canRepay =
    activeLoan &&
    repayNum > 0 &&
    repayNum <= activeLoan.amount_owed &&
    repayNum <= cashBalance
  const loanSliderMax = Math.max(100, Math.min(maxLoanEligible, 100_000))
  const loanSliderVal = Math.min(loanAmount, loanSliderMax)
  const weeks = LOAN_DURATION_DAYS / 7
  const estimatedInterest = loanSliderVal * (LOAN_INTEREST_RATE / 100) * weeks
  const totalRepayable = loanSliderVal + estimatedInterest
  const dueDateStr = new Date()
  dueDateStr.setDate(dueDateStr.getDate() + LOAN_DURATION_DAYS)

  const handleRepay = async () => {
    if (!canRepay) return
    setIsRepaying(true)
    try {
      const res = await fetch('/api/bank/repay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: repayNum }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Repay failed')
      setRepayAmount('')
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Repay failed')
    } finally {
      setIsRepaying(false)
    }
  }

  const handleRepayFull = () => {
    if (activeLoan && activeLoan.amount_owed <= cashBalance) {
      setRepayAmount(String(activeLoan.amount_owed))
    }
  }

  const handleApplyLoan = async () => {
    if (loanSliderVal < 100 || loanSliderVal > maxLoanEligible) return
    setIsApplying(true)
    try {
      const res = await fetch('/api/bank/loan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: loanSliderVal }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error ?? 'Loan application failed')
      router.refresh()
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Loan application failed')
    } finally {
      setIsApplying(false)
    }
  }

  const countdownDays = dueDate
    ? Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : 0
  const countdownUrgent = countdownDays < 7
  const countdownWarning = countdownDays < 14 && !countdownUrgent

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2"
      >
        <Landmark className="h-8 w-8 text-[#00ff88]" />
        <h1 className="text-2xl font-bold text-white">StockSim Bank</h1>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={CARD_STYLE}
        >
          <p className="text-sm font-medium text-zinc-400">Your Net Worth</p>
          <p className="mt-1 text-2xl font-bold text-white">
            {formatCurrency(netWorth)}
          </p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={CARD_STYLE}
        >
          <p className="text-sm font-medium text-zinc-400">Max Loan Eligible</p>
          <p className="mt-1 text-2xl font-bold text-[#00ff88]">
            {formatCurrency(maxLoanEligible)}
          </p>
          <p className="mt-0.5 text-xs text-zinc-500">50% of net worth</p>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className={CARD_STYLE}
        >
          <p className="text-sm font-medium text-zinc-400">Active Loan</p>
          {activeLoan ? (
            <p className="mt-1 text-2xl font-bold text-red-400">
              {formatCurrency(activeLoan.amount_owed)}
            </p>
          ) : (
            <p className="mt-1 text-lg font-semibold text-[#00ff88]">
              No Active Loan
            </p>
          )}
        </motion.div>
      </div>

      {activeLoan && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-6 w-6 shrink-0 text-amber-400" />
            <div className="flex-1">
              <h2 className="font-semibold text-amber-200">Active Loan</h2>
              <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                <p className="text-zinc-300">
                  Principal: {formatCurrency(activeLoan.principal)}
                </p>
                <p className="text-zinc-300">
                  Interest: {activeLoan.interest_rate}% per week
                </p>
                <p className="text-zinc-300">
                  Amount owed: {formatCurrency(activeLoan.amount_owed)}
                </p>
                <p className="text-zinc-300">
                  Repaid: {formatCurrency(activeLoan.repaid_amount)}
                </p>
              </div>
              <p className="mt-2 text-zinc-300">
                Due: {new Date(activeLoan.due_date).toLocaleDateString()}
                {countdown && (
                  <span
                    className={`ml-2 font-mono font-semibold ${
                      countdownUrgent
                        ? 'text-red-400'
                        : countdownWarning
                          ? 'text-amber-400'
                          : 'text-zinc-400'
                    }`}
                  >
                    ({countdown})
                  </span>
                )}
              </p>
              <div className="mt-3 h-2 w-full max-w-xs overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#00ff88] transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (activeLoan.repaid_amount / activeLoan.principal) * 100
                    )}%`,
                  }}
                />
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <input
                  type="number"
                  min={0}
                  step={0.01}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  placeholder="Amount to repay"
                  className="w-40 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-white placeholder-zinc-500 focus:border-[#00ff88] focus:outline-none focus:ring-1 focus:ring-[#00ff88]"
                />
                <button
                  type="button"
                  onClick={handleRepay}
                  disabled={!canRepay || isRepaying}
                  className="rounded-lg bg-[#00ff88]/20 px-4 py-2 font-medium text-[#00ff88] transition-colors hover:bg-[#00ff88]/30 disabled:pointer-events-none disabled:opacity-50"
                >
                  {isRepaying ? 'Processing…' : 'Repay Now'}
                </button>
                <button
                  type="button"
                  onClick={handleRepayFull}
                  disabled={activeLoan.amount_owed > cashBalance || isRepaying}
                  className="rounded-lg border border-[#00ff88]/50 px-4 py-2 text-sm font-medium text-[#00ff88] hover:bg-[#00ff88]/10 disabled:pointer-events-none disabled:opacity-50"
                >
                  Repay Full Amount
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {!activeLoan && maxLoanEligible >= 100 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className={CARD_STYLE}
        >
          <h2 className="font-semibold text-white">Apply for Loan</h2>
          <p className="mt-1 text-sm text-zinc-400">
            Borrow up to 50% of your net worth. Interest: {LOAN_INTEREST_RATE}%
            per week.
          </p>
          <div className="mt-4">
            <label className="block text-sm text-zinc-400">
              Loan amount: {formatCurrency(loanSliderVal)}
            </label>
            <input
              type="range"
              min={100}
              max={loanSliderMax}
              step={50}
              value={loanSliderVal}
              onChange={(e) => setLoanAmount(Number(e.target.value))}
              className="mt-2 w-full max-w-md accent-[#00ff88]"
            />
          </div>
          <div className="mt-3 space-y-1 text-sm text-zinc-400">
            <p>
              Estimated interest ({LOAN_INTEREST_RATE}% per week):{' '}
              {formatCurrency(estimatedInterest)}
            </p>
            <p className="font-medium text-white">
              Total repayable: {formatCurrency(totalRepayable)}
            </p>
            <p>Due date: {dueDateStr.toLocaleDateString()}</p>
          </div>
          <button
            type="button"
            onClick={handleApplyLoan}
            disabled={loanSliderVal < 100 || isApplying}
            className="mt-4 rounded-lg bg-[#00ff88]/20 px-6 py-3 font-semibold text-[#00ff88] transition-colors hover:bg-[#00ff88]/30 disabled:pointer-events-none disabled:opacity-50"
          >
            {isApplying ? 'Applying…' : 'Apply for Loan'}
          </button>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className={CARD_STYLE}
      >
        <h2 className="mb-4 font-semibold text-white">Loan History</h2>
        {loans.length === 0 ? (
          <p className="text-sm text-zinc-500">No loans yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06] text-left text-sm text-zinc-400">
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Interest Rate</th>
                  <th className="pb-3 font-medium">Amount Owed</th>
                  <th className="pb-3 font-medium">Repaid</th>
                  <th className="pb-3 font-medium">Due Date</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {loans.map((l) => (
                  <tr
                    key={l.id}
                    className="border-b border-white/[0.04] text-sm"
                  >
                    <td className="py-3 text-white">
                      {formatCurrency(l.principal)}
                    </td>
                    <td className="py-3 text-zinc-400">
                      {l.interest_rate}% / week
                    </td>
                    <td className="py-3 text-zinc-300">
                      {formatCurrency(l.amount_owed)}
                    </td>
                    <td className="py-3 text-zinc-300">
                      {formatCurrency(l.repaid_amount)}
                    </td>
                    <td className="py-3 text-zinc-400">
                      {new Date(l.due_date).toLocaleDateString()}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                          l.status === 'active'
                            ? 'bg-amber-500/20 text-amber-400'
                            : l.status === 'repaid'
                              ? 'bg-[#00ff88]/20 text-[#00ff88]'
                              : 'bg-red-500/20 text-red-400'
                        }`}
                      >
                        {l.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  )
}
