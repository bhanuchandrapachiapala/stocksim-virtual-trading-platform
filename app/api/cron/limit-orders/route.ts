import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PRICE_IMPACT_PER_SHARE } from '@/lib/constants'

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function checkCronAuth(request: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false
  const auth = request.headers.get('authorization')
  return auth === `Bearer ${secret}`
}

export async function GET(request: Request) {
  if (!checkCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = await createClient()
  let executedOrders = 0
  let triggeredAlerts = 0

  const { data: pendingOrders } = await supabase
    .from('orders')
    .select('id, user_id, company_id, side, quantity, price')
    .eq('status', 'pending')
    .eq('order_type', 'limit')

  const orders = (pendingOrders ?? []) as Array<{
    id: string
    user_id: string
    company_id: string
    side: string
    quantity: number
    price: number
  }>

  for (const order of orders) {
    const { data: company } = await supabase
      .from('companies')
      .select('id, ticker, current_price, shares_available')
      .eq('id', order.company_id)
      .single()

    if (!company) continue

    const currentPrice = Number(company.current_price ?? 0)
    const shouldExecute =
      order.side === 'buy'
        ? currentPrice <= order.price
        : currentPrice >= order.price

    if (!shouldExecute) continue

    const userId = order.user_id
    const companyId = order.company_id
    const quantity = order.quantity
    const execPrice = currentPrice

    const { data: userRow } = await supabase.from('users').select('cash_balance').eq('id', userId).single()
    const cashBalance = Number((userRow as { cash_balance?: number } | null)?.cash_balance ?? 0)
    const sharesAvailable = Number(company.shares_available ?? 0)

    if (order.side === 'buy') {
      const totalCost = round2(quantity * execPrice)
      if (cashBalance < totalCost || sharesAvailable < quantity) continue

      const newPrice = round2(execPrice * (1 + quantity * PRICE_IMPACT_PER_SHARE))

      await supabase.from('users').update({ cash_balance: round2(cashBalance - totalCost) }).eq('id', userId)
      await supabase.from('companies').update({
        shares_available: sharesAvailable - quantity,
        current_price: newPrice,
      }).eq('id', companyId)

      const { data: existing } = await supabase
        .from('holdings')
        .select('id, quantity, avg_buy_price')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .maybeSingle()

      const existingHolding = existing as { id: string; quantity: number; avg_buy_price: number } | null
      if (existingHolding) {
        const newQty = existingHolding.quantity + quantity
        const newAvg = round2(
          (existingHolding.quantity * existingHolding.avg_buy_price + quantity * execPrice) / newQty
        )
        await supabase.from('holdings').update({ quantity: newQty, avg_buy_price: newAvg, updated_at: new Date().toISOString() }).eq('id', existingHolding.id)
      } else {
        await supabase.from('holdings').insert({
          user_id: userId,
          company_id: companyId,
          quantity,
          avg_buy_price: execPrice,
          updated_at: new Date().toISOString(),
        })
      }

      await supabase.from('orders').update({ status: 'executed', executed_at: new Date().toISOString() }).eq('id', order.id)
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'buy',
        amount: -totalCost,
        description: `Bought ${quantity} shares of ${company.ticker} at $${execPrice.toFixed(2)} (limit)`,
      })
      await supabase.from('price_history').insert({ company_id: companyId, price: newPrice, recorded_at: new Date().toISOString() })
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'price_alert',
        message: `Your limit order for ${quantity} shares of ${company.ticker} was executed at $${execPrice.toFixed(2)}`,
      })
      executedOrders++
    } else {
      const { data: holdingRow } = await supabase
        .from('holdings')
        .select('id, quantity')
        .eq('user_id', userId)
        .eq('company_id', companyId)
        .maybeSingle()

      const holding = holdingRow as { id: string; quantity: number } | null
      if (!holding || holding.quantity < quantity) continue

      const totalProceeds = round2(quantity * execPrice)
      const newPrice = round2(execPrice * (1 - quantity * PRICE_IMPACT_PER_SHARE))

      await supabase.from('users').update({ cash_balance: round2(cashBalance + totalProceeds) }).eq('id', userId)
      await supabase.from('companies').update({
        shares_available: sharesAvailable + quantity,
        current_price: newPrice,
      }).eq('id', companyId)

      const newQty = holding.quantity - quantity
      if (newQty === 0) {
        await supabase.from('holdings').delete().eq('id', holding.id)
      } else {
        await supabase.from('holdings').update({ quantity: newQty, updated_at: new Date().toISOString() }).eq('id', holding.id)
      }

      await supabase.from('orders').update({ status: 'executed', executed_at: new Date().toISOString() }).eq('id', order.id)
      await supabase.from('transactions').insert({
        user_id: userId,
        type: 'sell',
        amount: totalProceeds,
        description: `Sold ${quantity} shares of ${company.ticker} at $${execPrice.toFixed(2)} (limit)`,
      })
      await supabase.from('price_history').insert({ company_id: companyId, price: newPrice, recorded_at: new Date().toISOString() })
      await supabase.from('notifications').insert({
        user_id: userId,
        type: 'price_alert',
        message: `Your limit order for ${quantity} shares of ${company.ticker} was executed at $${execPrice.toFixed(2)}`,
      })
      executedOrders++
    }
  }

  const { data: alerts } = await supabase
    .from('price_alerts')
    .select('id, user_id, company_id, target_price, direction')
    .eq('is_triggered', false)

  const alertList = (alerts ?? []) as Array<{
    id: string
    user_id: string
    company_id: string
    target_price: number
    direction: string
  }>

  for (const alert of alertList) {
    const { data: comp } = await supabase
      .from('companies')
      .select('ticker, current_price')
      .eq('id', alert.company_id)
      .single()

    if (!comp) continue

    const currentPrice = Number(comp.current_price ?? 0)
    const trigger =
      alert.direction === 'above'
        ? currentPrice >= alert.target_price
        : currentPrice <= alert.target_price

    if (!trigger) continue

    await supabase.from('price_alerts').update({ is_triggered: true }).eq('id', alert.id)
    const dirText = alert.direction === 'above' ? 'above' : 'below'
    await supabase.from('notifications').insert({
      user_id: alert.user_id,
      type: 'price_alert',
      message: `${comp.ticker} is now ${dirText} your target price of $${alert.target_price.toFixed(2)} (current: $${currentPrice.toFixed(2)})`,
    })
    triggeredAlerts++
  }

  return NextResponse.json({
    success: true,
    executed_orders: executedOrders,
    triggered_alerts: triggeredAlerts,
  })
}
