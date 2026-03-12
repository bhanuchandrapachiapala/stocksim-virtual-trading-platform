import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

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

    if (cashBalance < amount) {
      return NextResponse.json(
        { success: false, error: 'Insufficient cash balance to repay' },
        { status: 400 }
      )
    }

    const { data: activeLoan, error: loanError } = await supabase
      .from('loans')
      .select('id, amount_owed, repaid_amount')
      .eq('user_id', userId)
      .eq('status', 'active')
      .maybeSingle()

    if (loanError || !activeLoan) {
      return NextResponse.json(
        { success: false, error: 'No active loan found' },
        { status: 400 }
      )
    }

    const amountOwed = activeLoan.amount_owed as number
    const repaidSoFar = activeLoan.repaid_amount as number

    if (amount > amountOwed) {
      return NextResponse.json(
        { success: false, error: 'Repayment amount exceeds amount owed' },
        { status: 400 }
      )
    }

    const newRepaid = round2(repaidSoFar + amount)

    const { error: updateUserError } = await supabase
      .from('users')
      .update({ cash_balance: round2(cashBalance - amount) })
      .eq('id', userId)

    if (updateUserError) {
      return NextResponse.json(
        { success: false, error: 'Failed to deduct payment' },
        { status: 500 }
      )
    }

    const newStatus = newRepaid >= amountOwed ? 'repaid' : 'active'

    const { data: updatedLoan, error: updateLoanError } = await supabase
      .from('loans')
      .update({
        repaid_amount: newRepaid,
        status: newStatus,
      })
      .eq('id', activeLoan.id)
      .select()
      .single()

    if (updateLoanError || !updatedLoan) {
      return NextResponse.json(
        { success: false, error: 'Failed to update loan' },
        { status: 500 }
      )
    }

    const { error: txError } = await supabase.from('transactions').insert({
      user_id: userId,
      type: 'loan_repayment',
      amount: -amount,
      description: `Loan repayment: $${amount.toFixed(2)}`,
    })

    if (txError) {
      return NextResponse.json(
        { success: false, error: 'Failed to record transaction' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, loan: updatedLoan })
  } catch (err) {
    console.error('Repay API error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
