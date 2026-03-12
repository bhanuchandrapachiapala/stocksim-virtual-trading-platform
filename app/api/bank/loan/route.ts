import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { MAX_LOAN_PERCENT, LOAN_INTEREST_RATE, LOAN_DURATION_DAYS } from '@/lib/constants'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { amount?: number }
    const amount = body.amount

    if (typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()

    if (!authUser) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = authUser.id

    const { data: appUser, error: userError } = await supabase
      .from('users')
      .select('cash_balance')
      .eq('id', userId)
      .single()

    if (userError || !appUser) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      )
    }

    const cashBalance = appUser.cash_balance as number

    const { data: holdings } = await supabase
      .from('holdings')
      .select('quantity, companies(current_price)')
      .eq('user_id', userId)

    const portfolioValue = ((holdings ?? []) as unknown as Array<{ quantity: number; companies: { current_price: number } | null }>).reduce(
      (sum, h) => {
        const price = h.companies?.current_price ?? 0
        return sum + h.quantity * price
      },
      0
    )
    const netWorth = cashBalance + portfolioValue
    const maxEligible = netWorth * MAX_LOAN_PERCENT

    if (amount > maxEligible) {
      return NextResponse.json(
        {
          success: false,
          error: `Amount exceeds maximum eligible (${round2(maxEligible)} = 50% of net worth)`,
        },
        { status: 400 }
      )
    }

    const { data: existingActive } = await supabase
      .from('loans')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (existingActive) {
      return NextResponse.json(
        { success: false, error: 'You already have an active loan. Repay it before applying for a new one.' },
        { status: 400 }
      )
    }

    const dueDate = new Date()
    dueDate.setDate(dueDate.getDate() + LOAN_DURATION_DAYS)

    const { data: loan, error: loanError } = await supabase
      .from('loans')
      .insert({
        user_id: userId,
        principal: round2(amount),
        interest_rate: LOAN_INTEREST_RATE,
        amount_owed: round2(amount),
        repaid_amount: 0,
        due_date: dueDate.toISOString(),
        status: 'active',
      })
      .select()
      .single()

    if (loanError || !loan) {
      return NextResponse.json(
        { success: false, error: loanError?.message ?? 'Failed to create loan' },
        { status: 500 }
      )
    }

    const { error: updateUserError } = await supabase
      .from('users')
      .update({ cash_balance: round2(cashBalance + amount) })
      .eq('id', userId)

    if (updateUserError) {
      return NextResponse.json(
        { success: false, error: 'Failed to credit loan amount' },
        { status: 500 }
      )
    }

    const { error: txError } = await supabase.from('transactions').insert({
      user_id: userId,
      type: 'loan_disbursed',
      amount: amount,
      description: `Loan disbursed: $${amount.toFixed(2)}`,
    })

    if (txError) {
      return NextResponse.json(
        { success: false, error: 'Failed to record transaction' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, loan })
  } catch (err) {
    console.error('Loan API error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
