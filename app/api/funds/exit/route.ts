import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { fund_id?: string }
    const { fund_id } = body

    if (!fund_id) {
      return NextResponse.json(
        { success: false, error: 'fund_id is required' },
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
      .select('id, manager_id, total_value')
      .eq('id', fund_id)
      .single()

    if (fundError || !fund) {
      return NextResponse.json(
        { success: false, error: 'Fund not found' },
        { status: 404 }
      )
    }

    if (fund.manager_id === authUser.id) {
      return NextResponse.json(
        { success: false, error: 'Manager cannot exit the fund' },
        { status: 400 }
      )
    }

    const { data: membership, error: memberError } = await supabase
      .from('fund_members')
      .select('id, contribution')
      .eq('fund_id', fund_id)
      .eq('user_id', authUser.id)
      .maybeSingle()

    if (memberError || !membership) {
      return NextResponse.json(
        { success: false, error: 'You are not a member of this fund' },
        { status: 400 }
      )
    }

    const totalValue = fund.total_value as number
    const totalContributionsRes = await supabase
      .from('fund_members')
      .select('contribution')
      .eq('fund_id', fund_id)
    const totalContributions = (totalContributionsRes.data ?? []).reduce(
      (sum: number, r: { contribution: number }) => sum + (r.contribution ?? 0),
      0
    )
    const myContribution = membership.contribution as number
    const shareRatio = totalContributions > 0 ? myContribution / totalContributions : 0
    const proportionalValue = round2(totalValue * shareRatio)

    const { data: appUser } = await supabase
      .from('users')
      .select('cash_balance')
      .eq('id', authUser.id)
      .single()

    const cashBalance = (appUser?.cash_balance as number) ?? 0

    const { error: deleteMemberError } = await supabase
      .from('fund_members')
      .delete()
      .eq('id', membership.id)

    if (deleteMemberError) {
      return NextResponse.json(
        { success: false, error: 'Failed to remove membership' },
        { status: 500 }
      )
    }

    const { error: updateFundError } = await supabase
      .from('funds')
      .update({ total_value: round2(totalValue - proportionalValue) })
      .eq('id', fund_id)

    if (updateFundError) {
      return NextResponse.json(
        { success: false, error: 'Failed to update fund value' },
        { status: 500 }
      )
    }

    const { error: updateUserError } = await supabase
      .from('users')
      .update({ cash_balance: round2(cashBalance + proportionalValue) })
      .eq('id', authUser.id)

    if (updateUserError) {
      return NextResponse.json(
        { success: false, error: 'Failed to credit balance' },
        { status: 500 }
      )
    }

    const { error: txError } = await supabase.from('transactions').insert({
      user_id: authUser.id,
      type: 'fund_exit',
      amount: proportionalValue,
      description: `Fund exit: $${proportionalValue.toFixed(2)}`,
    })

    if (txError) {
      return NextResponse.json(
        { success: false, error: 'Failed to record transaction' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      returned_amount: proportionalValue,
    })
  } catch (err) {
    console.error('Funds exit API error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
