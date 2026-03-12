import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PRICE_IMPACT_PER_SHARE } from '@/lib/constants'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      fund_id?: string
      company_id?: string
      side?: 'buy' | 'sell'
      quantity?: number
    }
    const { fund_id, company_id, side, quantity } = body

    if (!fund_id || !company_id || !side || typeof quantity !== 'number' || quantity < 1 || !Number.isInteger(quantity)) {
      return NextResponse.json(
        { success: false, error: 'fund_id, company_id, side, and positive integer quantity required' },
        { status: 400 }
      )
    }

    if (side !== 'buy' && side !== 'sell') {
      return NextResponse.json(
        { success: false, error: 'side must be buy or sell' },
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

    if (fundError || !fund || fund.manager_id !== authUser.id) {
      return NextResponse.json(
        { success: false, error: 'Only the fund manager can trade' },
        { status: 403 }
      )
    }

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, ticker, current_price, shares_available')
      .eq('id', company_id)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { success: false, error: 'Company not found' },
        { status: 404 }
      )
    }

    const currentPrice = company.current_price as number
    const sharesAvailable = company.shares_available as number
    const fundTotalValue = fund.total_value as number

    const { data: holdings } = await supabase
      .from('fund_holdings')
      .select('quantity, companies(current_price)')
      .eq('fund_id', fund_id)

    const holdingsValue = ((holdings ?? []) as unknown as Array<{ quantity: number; companies: { current_price: number } | null }>).reduce(
      (sum, h) => {
        const price = h.companies?.current_price ?? 0
        return sum + h.quantity * price
      },
      0
    )
    const fundCash = round2(fundTotalValue - holdingsValue)

    if (side === 'buy') {
      const totalCost = round2(quantity * currentPrice)
      if (fundCash < totalCost) {
        return NextResponse.json(
          { success: false, error: 'Fund has insufficient cash' },
          { status: 400 }
        )
      }
      if (sharesAvailable < quantity) {
        return NextResponse.json(
          { success: false, error: 'Insufficient shares available' },
          { status: 400 }
        )
      }

      const newPrice = round2(currentPrice * (1 + quantity * PRICE_IMPACT_PER_SHARE))

      const { data: existing } = await supabase
        .from('fund_holdings')
        .select('id, quantity, avg_buy_price')
        .eq('fund_id', fund_id)
        .eq('company_id', company_id)
        .maybeSingle()

      if (existing) {
        const existingQty = existing.quantity as number
        const existingAvg = existing.avg_buy_price as number
        const newQty = existingQty + quantity
        const newAvg = round2(
          (existingQty * existingAvg + quantity * currentPrice) / newQty
        )
        await supabase
          .from('fund_holdings')
          .update({ quantity: newQty, avg_buy_price: newAvg })
          .eq('id', existing.id)
      } else {
        await supabase.from('fund_holdings').insert({
          fund_id,
          company_id,
          quantity,
          avg_buy_price: currentPrice,
        })
      }

      await supabase
        .from('companies')
        .update({
          current_price: newPrice,
          shares_available: sharesAvailable - quantity,
        })
        .eq('id', company_id)

      await supabase.from('price_history').insert({
        company_id,
        price: newPrice,
        recorded_at: new Date().toISOString(),
      })

      await supabase
        .from('funds')
        .update({ total_value: round2(fundTotalValue - totalCost + quantity * newPrice) })
        .eq('id', fund_id)

      return NextResponse.json({ success: true, new_price: newPrice })
    }

    const { data: holding, error: holdError } = await supabase
      .from('fund_holdings')
      .select('id, quantity, avg_buy_price')
      .eq('fund_id', fund_id)
      .eq('company_id', company_id)
      .maybeSingle()

    if (holdError || !holding) {
      return NextResponse.json(
        { success: false, error: 'Fund does not hold this stock' },
        { status: 400 }
      )
    }

    const ownedQty = holding.quantity as number
    if (ownedQty < quantity) {
      return NextResponse.json(
        { success: false, error: 'Fund does not own enough shares' },
        { status: 400 }
      )
    }

    const totalProceeds = round2(quantity * currentPrice)
    const newPrice = round2(currentPrice * (1 - quantity * PRICE_IMPACT_PER_SHARE))

    const newQty = ownedQty - quantity
    if (newQty === 0) {
      await supabase.from('fund_holdings').delete().eq('id', holding.id)
    } else {
      await supabase
        .from('fund_holdings')
        .update({ quantity: newQty })
        .eq('id', holding.id)
    }

    await supabase
      .from('companies')
      .update({
        current_price: newPrice,
        shares_available: sharesAvailable + quantity,
      })
      .eq('id', company_id)

    await supabase.from('price_history').insert({
      company_id,
      price: newPrice,
      recorded_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, new_price: newPrice })
  } catch (err) {
    console.error('Funds trade API error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
