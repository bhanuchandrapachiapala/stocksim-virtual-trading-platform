import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export async function DELETE(request: Request) {
  try {
    const body = (await request.json()) as { order_id?: string }
    const { order_id } = body

    if (!order_id) {
      return NextResponse.json(
        { success: false, error: 'order_id is required' },
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

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, user_id, side, order_type, quantity, price, status')
      .eq('id', order_id)
      .eq('user_id', authUser.id)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    if (order.status !== 'pending') {
      return NextResponse.json(
        { success: false, error: 'Order is not pending' },
        { status: 400 }
      )
    }

    if (order.order_type !== 'limit') {
      return NextResponse.json(
        { success: false, error: 'Only limit orders can be cancelled' },
        { status: 400 }
      )
    }

    if (order.side === 'buy') {
      const reserved = order.quantity * (order.price as number)
      const { data: appUser } = await supabase
        .from('users')
        .select('cash_balance')
        .eq('id', authUser.id)
        .single()
      const cash = (appUser?.cash_balance as number) ?? 0
      await supabase
        .from('users')
        .update({ cash_balance: round2(cash + reserved) })
        .eq('id', authUser.id)
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', order_id)
      .eq('user_id', authUser.id)

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Order cancel error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
