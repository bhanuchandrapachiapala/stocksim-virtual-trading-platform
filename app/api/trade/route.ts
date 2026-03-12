import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PRICE_IMPACT_PER_SHARE } from '@/lib/constants'

const WHALE_THRESHOLD = 2000
const DIVERSIFIED_SECTORS_COUNT = 5

type TradeBody = {
  company_id: string
  side: 'buy' | 'sell'
  quantity: number
  order_type: 'market' | 'limit'
  limit_price?: number
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as TradeBody
    const { company_id, side, quantity, order_type, limit_price: _limit_price } = body

    if (!company_id || side === undefined || quantity === undefined || order_type === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: company_id, side, quantity, order_type' },
        { status: 400 }
      )
    }

    if (side !== 'buy' && side !== 'sell') {
      return NextResponse.json(
        { success: false, error: 'Invalid side; must be "buy" or "sell"' },
        { status: 400 }
      )
    }

    if (typeof quantity !== 'number' || quantity < 1 || !Number.isInteger(quantity)) {
      return NextResponse.json(
        { success: false, error: 'Quantity must be a positive integer' },
        { status: 400 }
      )
    }

    if (order_type !== 'market') {
      return NextResponse.json(
        { success: false, error: 'Only market orders are supported; use the limit order API for limit orders' },
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

    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id, name, ticker, sector, current_price, shares_available, shares_outstanding')
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
      .select('id, cash_balance')
      .eq('id', userId)
      .single()

    if (userError || !appUser) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    const currentPrice = company.current_price as number
    const cashBalance = appUser.cash_balance as number
    const sharesAvailable = company.shares_available as number

    if (side === 'buy') {
      const totalCost = round2(quantity * currentPrice)

      if (cashBalance < totalCost) {
        return NextResponse.json(
          { success: false, error: 'Insufficient cash balance' },
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

      const { error: updateUserError } = await supabase
        .from('users')
        .update({ cash_balance: round2(cashBalance - totalCost) })
        .eq('id', userId)

      if (updateUserError) {
        return NextResponse.json(
          { success: false, error: 'Failed to update balance: ' + updateUserError.message },
          { status: 500 }
        )
      }

      const { error: updateCompanyAvailError } = await supabase
        .from('companies')
        .update({ shares_available: sharesAvailable - quantity })
        .eq('id', company_id)

      if (updateCompanyAvailError) {
        return NextResponse.json(
          { success: false, error: 'Failed to update shares available: ' + updateCompanyAvailError.message },
          { status: 500 }
        )
      }

      const { data: existingHolding } = await supabase
        .from('holdings')
        .select('id, quantity, avg_buy_price')
        .eq('user_id', userId)
        .eq('company_id', company_id)
        .maybeSingle()

      if (existingHolding) {
        const existingQty = existingHolding.quantity as number
        const existingAvg = existingHolding.avg_buy_price as number
        const newQty = existingQty + quantity
        const newAvg = round2(
          (existingQty * existingAvg + quantity * currentPrice) / newQty
        )
        const { error: updateHoldingError } = await supabase
          .from('holdings')
          .update({ quantity: newQty, avg_buy_price: newAvg, updated_at: new Date().toISOString() })
          .eq('id', existingHolding.id)

        if (updateHoldingError) {
          return NextResponse.json(
            { success: false, error: 'Failed to update holding: ' + updateHoldingError.message },
            { status: 500 }
          )
        }
      } else {
        const { error: insertHoldingError } = await supabase.from('holdings').insert({
          user_id: userId,
          company_id,
          quantity,
          avg_buy_price: currentPrice,
          updated_at: new Date().toISOString(),
        })

        if (insertHoldingError) {
          return NextResponse.json(
            { success: false, error: 'Failed to create holding: ' + insertHoldingError.message },
            { status: 500 }
          )
        }
      }

      const nowIso = new Date().toISOString()
      const { error: lotError } = await supabase.from('holding_lots').insert({
        user_id: userId,
        company_id,
        quantity,
        remaining_quantity: quantity,
        buy_price: currentPrice,
        purchased_at: nowIso,
        created_at: nowIso,
      })

      if (lotError) {
        return NextResponse.json(
          { success: false, error: 'Failed to record holding lot: ' + lotError.message },
          { status: 500 }
        )
      }

      const { error: orderError } = await supabase.from('orders').insert({
        user_id: userId,
        company_id,
        side: 'buy',
        order_type: 'market',
        quantity,
        price: currentPrice,
        status: 'executed',
        executed_at: new Date().toISOString(),
      })

      if (orderError) {
        return NextResponse.json(
          { success: false, error: 'Failed to record order: ' + orderError.message },
          { status: 500 }
        )
      }

      const desc = `Bought ${quantity} shares of ${company.ticker} at $${currentPrice.toFixed(2)}`
      const { error: txError } = await supabase.from('transactions').insert({
        user_id: userId,
        type: 'buy',
        amount: -totalCost,
        description: desc,
      })

      if (txError) {
        return NextResponse.json(
          { success: false, error: 'Failed to record transaction: ' + txError.message },
          { status: 500 }
        )
      }

      const { error: historyError } = await supabase.from('price_history').insert({
        company_id,
        price: newPrice,
        recorded_at: new Date().toISOString(),
      })

      if (historyError) {
        return NextResponse.json(
          { success: false, error: 'Failed to record price history: ' + historyError.message },
          { status: 500 }
        )
      }

      const { error: priceUpdateError } = await supabase
        .from('companies')
        .update({ current_price: newPrice })
        .eq('id', company_id)

      if (priceUpdateError) {
        return NextResponse.json(
          { success: false, error: 'Failed to update company price: ' + priceUpdateError.message },
          { status: 500 }
        )
      }

      const newBalance = round2(cashBalance - totalCost)
      await checkAndAwardAchievements(supabase, userId, totalCost, true)

      return NextResponse.json({
        success: true,
        new_price: newPrice,
        new_balance: newBalance,
        message: `Bought ${quantity} shares of ${company.ticker} at $${currentPrice.toFixed(2)}`,
      })
    }

    if (side === 'sell') {
      const twentyFourHoursAgo = new Date()
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
      const cutoffIso = twentyFourHoursAgo.toISOString()

      const { data: eligibleLots, error: lotsError } = await supabase
        .from('holding_lots')
        .select('id, remaining_quantity')
        .eq('user_id', userId)
        .eq('company_id', company_id)
        .gt('remaining_quantity', 0)
        .lte('purchased_at', cutoffIso)
        .order('purchased_at', { ascending: true })

      if (lotsError) {
        return NextResponse.json(
          { success: false, error: 'Failed to fetch holding lots: ' + lotsError.message },
          { status: 500 }
        )
      }

      const lots = (eligibleLots ?? []) as unknown as Array<{ id: string; remaining_quantity: number }>
      const totalSellableQuantity = lots.reduce((sum, lot) => sum + (lot.remaining_quantity ?? 0), 0)

      if (totalSellableQuantity < quantity) {
        return NextResponse.json(
          {
            success: false,
            error: `You can only sell ${totalSellableQuantity} shares. Shares purchased in the last 24 hours cannot be sold yet.`,
            total_sellable_quantity: totalSellableQuantity,
          },
          { status: 400 }
        )
      }

      let remainingToConsume = quantity
      for (const lot of lots) {
        if (remainingToConsume <= 0) break
        const take = Math.min(lot.remaining_quantity, remainingToConsume)
        const newRemaining = lot.remaining_quantity - take
        remainingToConsume -= take

        const { error: updateLotError } = await supabase
          .from('holding_lots')
          .update({ remaining_quantity: newRemaining })
          .eq('id', lot.id)

        if (updateLotError) {
          return NextResponse.json(
            { success: false, error: 'Failed to update holding lot: ' + updateLotError.message },
            { status: 500 }
          )
        }
      }

      const { data: holding, error: holdingError } = await supabase
        .from('holdings')
        .select('id, quantity, avg_buy_price')
        .eq('user_id', userId)
        .eq('company_id', company_id)
        .maybeSingle()

      if (holdingError || !holding) {
        return NextResponse.json(
          { success: false, error: 'You do not own any shares of this stock' },
          { status: 400 }
        )
      }

      const ownedQty = holding.quantity as number
      if (ownedQty < quantity) {
        return NextResponse.json(
          { success: false, error: `Insufficient shares; you own ${ownedQty} shares` },
          { status: 400 }
        )
      }

      const totalProceeds = round2(quantity * currentPrice)
      const newPrice = round2(currentPrice * (1 - quantity * PRICE_IMPACT_PER_SHARE))

      const { error: updateUserError } = await supabase
        .from('users')
        .update({ cash_balance: round2(cashBalance + totalProceeds) })
        .eq('id', userId)

      if (updateUserError) {
        return NextResponse.json(
          { success: false, error: 'Failed to update balance: ' + updateUserError.message },
          { status: 500 }
        )
      }

      const { error: updateCompanyAvailError } = await supabase
        .from('companies')
        .update({ shares_available: sharesAvailable + quantity })
        .eq('id', company_id)

      if (updateCompanyAvailError) {
        return NextResponse.json(
          { success: false, error: 'Failed to update shares available: ' + updateCompanyAvailError.message },
          { status: 500 }
        )
      }

      const newQty = ownedQty - quantity
      if (newQty === 0) {
        const { error: deleteHoldingError } = await supabase
          .from('holdings')
          .delete()
          .eq('id', holding.id)

        if (deleteHoldingError) {
          return NextResponse.json(
            { success: false, error: 'Failed to remove holding: ' + deleteHoldingError.message },
            { status: 500 }
          )
        }
      } else {
        const { error: updateHoldingError } = await supabase
          .from('holdings')
          .update({ quantity: newQty, updated_at: new Date().toISOString() })
          .eq('id', holding.id)

        if (updateHoldingError) {
          return NextResponse.json(
            { success: false, error: 'Failed to update holding: ' + updateHoldingError.message },
            { status: 500 }
          )
        }
      }

      const { error: orderError } = await supabase.from('orders').insert({
        user_id: userId,
        company_id,
        side: 'sell',
        order_type: 'market',
        quantity,
        price: currentPrice,
        status: 'executed',
        executed_at: new Date().toISOString(),
      })

      if (orderError) {
        return NextResponse.json(
          { success: false, error: 'Failed to record order: ' + orderError.message },
          { status: 500 }
        )
      }

      const desc = `Sold ${quantity} shares of ${company.ticker} at $${currentPrice.toFixed(2)}`
      const { error: txError } = await supabase.from('transactions').insert({
        user_id: userId,
        type: 'sell',
        amount: totalProceeds,
        description: desc,
      })

      if (txError) {
        return NextResponse.json(
          { success: false, error: 'Failed to record transaction: ' + txError.message },
          { status: 500 }
        )
      }

      const { error: historyError } = await supabase.from('price_history').insert({
        company_id,
        price: newPrice,
        recorded_at: new Date().toISOString(),
      })

      if (historyError) {
        return NextResponse.json(
          { success: false, error: 'Failed to record price history: ' + historyError.message },
          { status: 500 }
        )
      }

      const { error: priceUpdateError } = await supabase
        .from('companies')
        .update({ current_price: newPrice })
        .eq('id', company_id)

      if (priceUpdateError) {
        return NextResponse.json(
          { success: false, error: 'Failed to update company price: ' + priceUpdateError.message },
          { status: 500 }
        )
      }

      const newBalance = round2(cashBalance + totalProceeds)
      await checkAndAwardAchievements(supabase, userId, totalProceeds, false)

      return NextResponse.json({
        success: true,
        new_price: newPrice,
        new_balance: newBalance,
        message: `Sold ${quantity} shares of ${company.ticker} at $${currentPrice.toFixed(2)}`,
      })
    }

    return NextResponse.json(
      { success: false, error: 'Invalid side' },
      { status: 400 }
    )
  } catch (err) {
    console.error('Trade API error:', err)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function checkAndAwardAchievements(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  tradeValue: number,
  isBuy: boolean
) {
  const existingAchievements = await supabase
    .from('achievements')
    .select('badge_name')
    .eq('user_id', userId)

  const badges = new Set((existingAchievements.data ?? []).map((a) => a.badge_name as string))

  const toInsert: Array<{ user_id: string; badge_name: string; earned_at: string }> = []
  const now = new Date().toISOString()

  if (!badges.has('First Trade')) {
    const { count } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'executed')

    if ((count ?? 0) <= 1) {
      toInsert.push({ user_id: userId, badge_name: 'First Trade', earned_at: now })
      badges.add('First Trade')
    }
  }

  if (!badges.has('Whale') && tradeValue >= WHALE_THRESHOLD) {
    toInsert.push({ user_id: userId, badge_name: 'Whale', earned_at: now })
  }

  if (!badges.has('Diversified')) {
    const { data: holdings } = await supabase
      .from('holdings')
      .select('company_id')
      .eq('user_id', userId)

    if (holdings?.length) {
      const companyIds = holdings.map((h) => h.company_id)
      const { data: companies } = await supabase
        .from('companies')
        .select('sector')
        .in('id', companyIds)

      const sectors = new Set((companies ?? []).map((c) => c.sector).filter(Boolean))
      if (sectors.size >= DIVERSIFIED_SECTORS_COUNT) {
        toInsert.push({ user_id: userId, badge_name: 'Diversified', earned_at: now })
      }
    }
  }

  if (toInsert.length > 0) {
    await supabase.from('achievements').insert(toInsert)
  }
}
