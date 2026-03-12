import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      company_id?: string
      side?: 'buy' | 'sell'
      quantity?: number
      limit_price?: number
    }
    const { company_id, side, quantity, limit_price } = body

    if (!company_id || !side || quantity === undefined || limit_price === undefined) {
      return NextResponse.json(
        { success: false, error: 'company_id, side, quantity, and limit_price are required' },
        { status: 400 }
      )
    }

    if (side !== 'buy' && side !== 'sell') {
      return NextResponse.json(
        { success: false, error: 'side must be "buy" or "sell"' },
        { status: 400 }
      )
    }

    if (typeof quantity !== 'number' || quantity < 1 || !Number.isInteger(quantity)) {
      return NextResponse.json(
        { success: false, error: 'quantity must be a positive integer' },
        { status: 400 }
      )
    }

    if (typeof limit_price !== 'number' || limit_price <= 0) {
      return NextResponse.json(
        { success: false, error: 'limit_price must be a positive number' },
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

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', company_id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
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

    const cashBalance = (appUser.cash_balance as number) ?? 0

    if (side === 'buy') {
      const totalCost = quantity * limit_price
      if (cashBalance < totalCost) {
        return NextResponse.json(
          { success: false, error: 'Insufficient cash balance for this order' },
          { status: 400 }
        )
      }
    }

    if (side === 'sell') {
      const { data: holding } = await supabase
        .from('holdings')
        .select('quantity')
        .eq('user_id', authUser.id)
        .eq('company_id', company_id)
        .maybeSingle()

      const ownedQty = (holding?.quantity as number) ?? 0
      if (ownedQty < quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient shares; you own ${ownedQty} shares` },
          { status: 400 }
        )
      }
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert({
        user_id: authUser.id,
        company_id,
        side,
        order_type: 'limit',
        quantity,
        price: limit_price,
        status: 'pending',
      })
      .select()
      .single()

    if (orderError) {
      return NextResponse.json(
        { success: false, error: orderError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, order })
  } catch (err) {
    console.error('Limit order error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
