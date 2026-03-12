import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardContent } from './_components/DashboardContent'

type HoldingRow = {
  id: string
  quantity: number
  avg_buy_price: number
  company: {
    name: string
    ticker: string
    current_price: number
  } | null
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const [userResult, holdingsResult, transactionsResult, loanResult] =
    await Promise.all([
      supabase
        .from('users')
        .select('cash_balance, display_name, is_bankrupt')
        .eq('id', authUser.id)
        .single(),
      supabase
        .from('holdings')
        .select(
          'id, quantity, avg_buy_price, companies(name, ticker, current_price)'
        )
        .eq('user_id', authUser.id),
      supabase
        .from('transactions')
        .select('id, type, amount, description, created_at')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('loans')
        .select('id, amount_owed, due_date')
        .eq('user_id', authUser.id)
        .eq('status', 'active')
        .maybeSingle(),
    ])

  const user = userResult.data
  const holdingsRaw = (holdingsResult.data ?? []) as unknown as Array<{
    id: string
    quantity: number
    avg_buy_price: number
    companies: { name: string; ticker: string; current_price: number } | null
  }>
  const transactions = transactionsResult.data ?? []
  const activeLoan = loanResult.data

  const holdings: HoldingRow[] = holdingsRaw.map((h) => ({
    id: h.id,
    quantity: h.quantity,
    avg_buy_price: h.avg_buy_price,
    company: h.companies ?? null,
  }))

  const cashBalance = user?.cash_balance ?? 0
  const portfolioValue = holdings.reduce((sum, h) => {
    const price = h.company?.current_price ?? 0
    return sum + h.quantity * price
  }, 0)
  const totalInvested = holdings.reduce(
    (sum, h) => sum + h.quantity * h.avg_buy_price,
    0
  )
  const netWorth = cashBalance + portfolioValue
  const totalPnL = portfolioValue - totalInvested

  return (
    <DashboardContent
      displayName={user?.display_name ?? ''}
      isBankrupt={user?.is_bankrupt ?? false}
      cashBalance={cashBalance}
      netWorth={netWorth}
      portfolioValue={portfolioValue}
      totalPnL={totalPnL}
      holdings={holdings}
      transactions={transactions}
      activeLoan={
        activeLoan
          ? {
              id: activeLoan.id,
              amount_owed: activeLoan.amount_owed,
              due_date: activeLoan.due_date,
            }
          : null
      }
    />
  )
}
