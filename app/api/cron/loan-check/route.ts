import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PRICE_IMPACT_PER_SHARE } from '@/lib/constants'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function checkCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!checkCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  const now = new Date().toISOString()

  const { data: overdueLoans, error: loansErr } = await supabase
    .from('loans')
    .select('id, user_id, amount_owed, principal')
    .eq('status', 'active')
    .lt('due_date', now)

  if (loansErr || !overdueLoans?.length) {
    return NextResponse.json({ success: true, processed: 0 })
  }

  let processed = 0

  for (const loan of overdueLoans) {
    const userId = loan.user_id
    const amountOwed = Number(loan.amount_owed ?? 0)

    const { data: holdings } = await supabase
      .from('holdings')
      .select('id, quantity, company_id, companies(current_price, shares_available)')
      .eq('user_id', userId)

    const holdingsList = (holdings ?? []) as unknown as Array<{
      id: string
      quantity: number
      company_id: string
      companies: { current_price: number; shares_available: number } | null
    }>

    let totalRecovered = 0
    const { data: userRow } = await supabase.from('users').select('cash_balance').eq('id', userId).single()
    let cashBalance = Number((userRow as { cash_balance?: number } | null)?.cash_balance ?? 0)

    for (const h of holdingsList) {
      const qty = h.quantity ?? 0
      const companyId = h.company_id
      const companyData = h.companies
      const currentPrice = companyData?.current_price ?? 0
      const sharesAvailable = companyData?.shares_available ?? 0
      if (qty <= 0 || currentPrice <= 0) continue

      const proceeds = round2(qty * currentPrice)
      const newPrice = round2(currentPrice * (1 - qty * PRICE_IMPACT_PER_SHARE))

      cashBalance = round2(cashBalance + proceeds)
      totalRecovered += proceeds

      await supabase.from('users').update({ cash_balance: cashBalance }).eq('id', userId)
      await supabase.from('holdings').delete().eq('id', h.id)
      await supabase.from('companies').update({
        shares_available: sharesAvailable + qty,
        current_price: newPrice,
      }).eq('id', companyId)
      await supabase.from('price_history').insert({
        company_id: companyId,
        price: newPrice,
        recorded_at: new Date().toISOString(),
      })
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'loan_liquidation',
        amount: proceeds,
        description: `Loan liquidation: sold ${qty} shares`,
      })
    }

    if (cashBalance >= amountOwed) {
      const newCash = round2(cashBalance - amountOwed)
      await supabase.from('users').update({ cash_balance: newCash }).eq('id', userId)
      await supabase.from('loans').update({ status: 'repaid' }).eq('id', loan.id)
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'loan_repayment',
        amount: -amountOwed,
        description: 'Loan repayment (auto from liquidation)',
      })
    } else {
      await supabase.from('users').update({ cash_balance: 0, is_bankrupt: true }).eq('id', userId)
      await supabase.from('loans').update({ status: 'defaulted' }).eq('id', loan.id)
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'loan_defaulted',
        message: `Your loan of $${amountOwed.toFixed(2)} was not repaid in time. Your holdings were liquidated (recovered $${totalRecovered.toFixed(2)}). Your account has been marked bankrupt.`,
      })
    }
    processed++
  }

  return NextResponse.json({ success: true, processed })
}
