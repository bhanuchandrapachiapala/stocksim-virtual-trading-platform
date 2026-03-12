import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string
      description?: string
      min_buy_in?: number
      fee_percent?: number
    }
    const { name, description, min_buy_in, fee_percent } = body

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Fund name is required' },
        { status: 400 }
      )
    }

    if (typeof min_buy_in !== 'number' || min_buy_in < 0) {
      return NextResponse.json(
        { success: false, error: 'Minimum buy-in must be a non-negative number' },
        { status: 400 }
      )
    }

    if (
      typeof fee_percent !== 'number' ||
      fee_percent < 0 ||
      fee_percent > 5
    ) {
      return NextResponse.json(
        { success: false, error: 'Management fee must be between 0 and 5%' },
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
      .insert({
        name: name.trim(),
        description: (description ?? '').trim(),
        manager_id: authUser.id,
        total_value: 0,
        fee_percent: round2(fee_percent),
        min_buy_in: round2(min_buy_in),
      })
      .select()
      .single()

    if (fundError || !fund) {
      return NextResponse.json(
        { success: false, error: fundError?.message ?? 'Failed to create fund' },
        { status: 500 }
      )
    }

    const { error: memberError } = await supabase.from('fund_members').insert({
      fund_id: fund.id,
      user_id: authUser.id,
      contribution: 0,
      joined_at: new Date().toISOString(),
    })

    if (memberError) {
      return NextResponse.json(
        { success: false, error: 'Failed to add manager as member' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, fund })
  } catch (err) {
    console.error('Funds create API error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
