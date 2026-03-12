import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MAX_LOAN_PERCENT } from '@/lib/constants'
import { BankContent } from './_components/BankContent'

export default async function BankPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const [userRes, holdingsRes, loansRes] = await Promise.all([
    supabase.from('users').select('cash_balance').eq('id', authUser.id).single(),
    supabase
      .from('holdings')
      .select('quantity, companies(current_price)')
      .eq('user_id', authUser.id),
    supabase
      .from('loans')
      .select('id, principal, interest_rate, amount_owed, repaid_amount, due_date, status, created_at')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false }),
  ])

  const cashBalance = (userRes.data as { cash_balance: number } | null)?.cash_balance ?? 0
  const holdings = (holdingsRes.data ?? []) as Array<{
    quantity: number
    companies: { current_price: number } | null
  }>
  const portfolioValue = holdings.reduce((sum, h) => {
    const price = h.companies?.current_price ?? 0
    return sum + h.quantity * price
  }, 0)
  const netWorth = cashBalance + portfolioValue
  const maxLoanEligible = Math.max(0, Math.floor(netWorth * MAX_LOAN_PERCENT))

  const loans = (loansRes.data ?? []) as Array<{
    id: string
    principal: number
    interest_rate: number
    amount_owed: number
    repaid_amount: number
    due_date: string
    status: string
    created_at: string
  }>
  const activeLoan = loans.find((l) => l.status === 'active') ?? null
  const amountBorrowed = activeLoan?.amount_owed ?? 0
  const daysRemaining = activeLoan
    ? Math.ceil(
        (new Date(activeLoan.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
      )
    : null

  return (
    <BankContent
      netWorth={netWorth}
      maxLoanEligible={maxLoanEligible}
      activeLoan={activeLoan}
      amountBorrowed={amountBorrowed}
      daysRemaining={daysRemaining}
      loans={loans}
      cashBalance={cashBalance}
    />
  )
}
