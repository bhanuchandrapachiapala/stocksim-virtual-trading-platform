import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { fund_id?: string; amount?: number }
    const { fund_id, amount } = body

    if (!fund_id || typeof amount !== 'number' || amount <= 0) {
      return NextResponse.json(
        { success: false, error: 'fund_id and positive amount are required' },
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

    const { data: fund, error: fundError } = await supabase
      .from('funds')
      .select('id, min_buy_in, total_value')
      .eq('id', fund_id)
      .single()

    if (fundError || !fund) {
      return NextResponse.json(
        { success: false, error: 'Fund not found' },
        { status: 404 }
      )
    }

    const minBuyIn = fund.min_buy_in as number
    if (amount < minBuyIn) {
      return NextResponse.json(
        { success: false, error: `Minimum buy-in is ${round2(minBuyIn)}` },
        { status: 400 }
      )
    }

    const { data: appUser, error: userError } = await supabase
      .from('users')
      .select('cash_balance')
      .eq('id', authUser.id)
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
        { success: false, error: 'Insufficient cash balance' },
        { status: 400 }
      )
    }

    const { data: existing } = await supabase
      .from('fund_members')
      .select('id, contribution')
      .eq('fund_id', fund_id)
      .eq('user_id', authUser.id)
      .maybeSingle()

    const currentTotal = fund.total_value as number

    if (existing) {
      const newContribution = round2((existing.contribution as number) + amount)
      const { error: updateMemberError } = await supabase
        .from('fund_members')
        .update({ contribution: newContribution })
        .eq('id', existing.id)

      if (updateMemberError) {
        return NextResponse.json(
          { success: false, error: 'Failed to update membership' },
          { status: 500 }
        )
      }
    } else {
      const { error: insertMemberError } = await supabase
        .from('fund_members')
        .insert({
          fund_id,
          user_id: authUser.id,
          contribution: round2(amount),
          joined_at: new Date().toISOString(),
        })

      if (insertMemberError) {
        return NextResponse.json(
          { success: false, error: 'Failed to join fund' },
          { status: 500 }
        )
      }
    }

    const { error: updateFundError } = await supabase
      .from('funds')
      .update({ total_value: round2(currentTotal + amount) })
      .eq('id', fund_id)

    if (updateFundError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update fund value' },
        { status: 500 }
      )
    }

    const { error: updateUserError } = await supabase
      .from('users')
      .update({ cash_balance: round2(cashBalance - amount) })
      .eq('id', authUser.id)

    if (updateUserError) {
      return NextResponse.json(
        { success: false, error: 'Failed to deduct balance' },
        { status: 500 }
      )
    }

    const { error: txError } = await supabase.from('transactions').insert({
      user_id: authUser.id,
      type: 'fund_contribution',
      amount: -amount,
      description: `Fund contribution: $${amount.toFixed(2)}`,
    })

    if (txError) {
      return NextResponse.json(
        { success: false, error: 'Failed to record transaction' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Funds join API error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
