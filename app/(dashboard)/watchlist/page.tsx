import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { WatchlistContent } from './_components/WatchlistContent'

export default async function WatchlistPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const { data: watchlistRows } = await supabase
    .from('watchlist')
    .select('company_id, companies(id, name, ticker, sector, current_price)')
    .eq('user_id', authUser.id)

  const entries = (watchlistRows ?? []) as unknown as Array<{
    company_id: string
    companies: {
      id: string
      name: string
      ticker: string
      sector: string
      current_price: number
    } | null
  }>

  const companyIds = entries.map((e) => e.company_id).filter(Boolean)
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const [historyRes, holdingsRes] = await Promise.all([
    companyIds.length
      ? supabase
          .from('price_history')
          .select('company_id, price, recorded_at')
          .in('company_id', companyIds)
          .gte('recorded_at', sevenDaysAgo.toISOString())
          .order('recorded_at', { ascending: true })
      : { data: [] as Array<{ company_id: string; price: number; recorded_at: string }> },
    supabase
      .from('holdings')
      .select('company_id, quantity')
      .eq('user_id', authUser.id),
  ])

  const history = (historyRes.data ?? []) as unknown as Array<{
    company_id: string
    price: number
    recorded_at: string
  }>
  const historyByCompany = new Map<string, Array<{ price: number; recorded_at: string }>>()
  for (const h of history) {
    if (!historyByCompany.has(h.company_id)) {
      historyByCompany.set(h.company_id, [])
    }
    historyByCompany.get(h.company_id)!.push({ price: h.price, recorded_at: h.recorded_at })
  }

  const holdings = (holdingsRes.data ?? []) as unknown as Array<{ company_id: string; quantity: number }>
  const holdingByCompany = new Map(holdings.map((h) => [h.company_id, h.quantity]))

  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)

  const items = entries
    .filter((e) => e.companies)
    .map((e) => {
      const c = e.companies!
      const prices = historyByCompany.get(e.company_id) ?? []
      const price24hAgo = prices
        .filter((p) => new Date(p.recorded_at) <= twentyFourHoursAgo)
        .pop()?.price
      const change24hPct =
        price24hAgo != null && price24hAgo > 0
          ? ((c.current_price - price24hAgo) / price24hAgo) * 100
          : null
      return {
        company_id: e.company_id,
        name: c.name,
        ticker: c.ticker,
        sector: c.sector,
        current_price: c.current_price,
        change_24h_pct: change24hPct,
        sparkline_data: prices.map((p) => ({ price: p.price })),
        owned_quantity: holdingByCompany.get(e.company_id) ?? 0,
      }
    })

  return <WatchlistContent items={items} />
}
