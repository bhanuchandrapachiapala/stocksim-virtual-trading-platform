import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ADMIN_GRANT_AMOUNT } from '@/lib/constants'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const isAdmin = (user.app_metadata?.is_admin as boolean) === true
    if (!isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { user_id, amount } = body as { user_id?: string; amount?: number }
    if (!user_id) return NextResponse.json({ success: false, error: 'user_id required' }, { status: 400 })

    const grantAmount = typeof amount === 'number' && amount > 0 ? amount : ADMIN_GRANT_AMOUNT

    const { data: targetUser, error: userErr } = await supabase
      .from('users')
      .select('id, cash_balance')
      .eq('id', user_id)
      .single()

    if (userErr || !targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    }

    const newBalance = (targetUser.cash_balance ?? 0) + grantAmount

    const { error: updateErr } = await supabase
      .from('users')
      .update({ cash_balance: newBalance, is_bankrupt: false })
      .eq('id', user_id)

    if (updateErr) return NextResponse.json({ success: false, error: updateErr.message }, { status: 500 })

    await supabase.from('transactions').insert({
      user_id,
      type: 'admin_grant',
      amount: grantAmount,
      description: `Admin grant: $${grantAmount.toFixed(2)}`,
    })

    return NextResponse.json({ success: true, new_balance: newBalance })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
