import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StockDetail } from './_components/StockDetail'

type PageProps = {
  params: Promise<{ ticker: string }>
}

export default async function StockPage({ params }: PageProps) {
  const { ticker } = await params
  const tickerUpper = ticker.toUpperCase()
  const supabase = await createClient()

  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    notFound()
  }

  const { data: companyRow } = await supabase
    .from('companies')
    .select('id, name, ticker, sector, description, current_price, shares_outstanding, shares_available')
    .eq('ticker', tickerUpper)
    .single()

  if (!companyRow) {
    notFound()
  }

  const companyId = companyRow.id
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

  const [historyRes, holdingRes, lotsRes, ordersRes, newsRes, userRes, priceAlertsRes] = await Promise.all([
    supabase
      .from('price_history')
      .select('price, recorded_at')
      .eq('company_id', companyId)
      .gte('recorded_at', thirtyDaysAgo.toISOString())
      .order('recorded_at', { ascending: true }),
    supabase
      .from('holdings')
      .select('quantity, avg_buy_price')
      .eq('user_id', authUser.id)
      .eq('company_id', companyId)
      .maybeSingle(),
    supabase
      .from('holding_lots')
      .select('id, remaining_quantity, buy_price, purchased_at')
      .eq('user_id', authUser.id)
      .eq('company_id', companyId)
      .gt('remaining_quantity', 0)
      .order('purchased_at', { ascending: true }),
    supabase
      .from('orders')
      .select('id, side, quantity, price, created_at, executed_at')
      .eq('user_id', authUser.id)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('news')
      .select('id, title, body, is_pinned, created_at')
      .contains('ticker_tags', [tickerUpper])
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('users')
      .select('cash_balance')
      .eq('id', authUser.id)
      .single(),
    supabase
      .from('price_alerts')
      .select('id, target_price, direction, is_triggered, created_at')
      .eq('user_id', authUser.id)
      .eq('company_id', companyId)
      .order('created_at', { ascending: false }),
  ])

  const priceHistory = (historyRes.data ?? []) as unknown as Array<{ price: number; recorded_at: string }>
  const holdingData = holdingRes.data
  const lots = (lotsRes.data ?? []) as unknown as Array<{
    id: string
    remaining_quantity: number
    buy_price: number
    purchased_at: string
  }>
  const cutoff24h = twentyFourHoursAgo.getTime()
  let sellableQuantity = 0
  let lockedQuantity = 0
  lots.forEach((lot) => {
    const purchasedAt = new Date(lot.purchased_at).getTime()
    const qty = lot.remaining_quantity ?? 0
    if (purchasedAt <= cutoff24h) sellableQuantity += qty
    else lockedQuantity += qty
  })
  const recentOrders = (ordersRes.data ?? []) as unknown as Array<{
    id: string
    side: string
    quantity: number
    price: number
    created_at: string
    executed_at: string | null
  }>
  const relatedNews = (newsRes.data ?? []) as unknown as Array<{
    id: string
    title: string
    body: string
    is_pinned: boolean
    created_at: string
  }>
  const cashBalance = (userRes.data as { cash_balance: number } | null)?.cash_balance ?? 0
  const priceAlerts = (priceAlertsRes.data ?? []) as unknown as Array<{
    id: string
    target_price: number
    direction: string
    is_triggered: boolean
    created_at: string
  }>

  const price24hAgo = priceHistory.filter(
    (p) => new Date(p.recorded_at) <= twentyFourHoursAgo
  ).pop()?.price
  const change24hPct =
    price24hAgo != null && price24hAgo > 0
      ? ((companyRow.current_price - price24hAgo) / price24hAgo) * 100
      : null

  const marketCap = companyRow.current_price * companyRow.shares_outstanding

  return (
    <StockDetail
      company={{
        id: companyRow.id,
        name: companyRow.name,
        ticker: companyRow.ticker,
        sector: companyRow.sector,
        description: companyRow.description,
        current_price: companyRow.current_price,
        shares_outstanding: companyRow.shares_outstanding,
        shares_available: companyRow.shares_available,
        market_cap: marketCap,
        change_24h_pct: change24hPct,
      }}
      priceHistory={priceHistory}
      holding={
        holdingData
          ? { quantity: holdingData.quantity, avg_buy_price: holdingData.avg_buy_price }
          : null
      }
      holdingLots={lots}
      sellableQuantity={sellableQuantity}
      lockedQuantity={lockedQuantity}
      recentOrders={recentOrders}
      relatedNews={relatedNews}
      cashBalance={cashBalance}
      priceAlerts={priceAlerts}
    />
  )
}
