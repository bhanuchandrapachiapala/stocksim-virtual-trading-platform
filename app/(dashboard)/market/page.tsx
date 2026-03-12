import { createClient } from '@/lib/supabase/server'
import { MarketContent } from './_components/MarketContent'

export type MarketCompany = {
  id: string
  name: string
  ticker: string
  sector: string
  current_price: number
  shares_available: number
  shares_outstanding: number
  market_cap: number
  change_24h_pct: number | null
}

export default async function MarketPage() {
  const supabase = await createClient()

  const twentyFourHoursAgo = new Date()
  twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24)
  const fortyEightHoursAgo = new Date()
  fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48)

  const [companiesResult, historyResult] = await Promise.all([
    supabase
      .from('companies')
      .select('id, name, ticker, sector, current_price, shares_available, shares_outstanding'),
    supabase
      .from('price_history')
      .select('company_id, price, recorded_at')
      .gte('recorded_at', fortyEightHoursAgo.toISOString())
      .lte('recorded_at', twentyFourHoursAgo.toISOString())
      .order('recorded_at', { ascending: false }),
  ])

  const companies = (companiesResult.data ?? []) as unknown as Array<{
    id: string
    name: string
    ticker: string
    sector: string
    current_price: number
    shares_available: number
    shares_outstanding: number
  }>

  const history = (historyResult.data ?? []) as unknown as Array<{
    company_id: string
    price: number
    recorded_at: string
  }>

  const price24hAgoByCompany = new Map<string, number>()
  for (const row of history) {
    if (!price24hAgoByCompany.has(row.company_id)) {
      price24hAgoByCompany.set(row.company_id, row.price)
    }
  }

  const marketCompanies: MarketCompany[] = companies.map((c) => {
    const marketCap = c.current_price * c.shares_outstanding
    const price24hAgo = price24hAgoByCompany.get(c.id)
    const change24hPct =
      price24hAgo != null && price24hAgo > 0
        ? ((c.current_price - price24hAgo) / price24hAgo) * 100
        : null

    return {
      id: c.id,
      name: c.name,
      ticker: c.ticker,
      sector: c.sector,
      current_price: c.current_price,
      shares_available: c.shares_available,
      shares_outstanding: c.shares_outstanding,
      market_cap: marketCap,
      change_24h_pct: change24hPct,
    }
  })

  const withChange = marketCompanies.filter((c) => c.change_24h_pct != null)
  const topGainer =
    withChange.length > 0
      ? withChange.reduce((a, b) =>
          (a.change_24h_pct ?? 0) > (b.change_24h_pct ?? 0) ? a : b
        )
      : marketCompanies[0] ?? null
  const topLoser =
    withChange.length > 0
      ? withChange.reduce((a, b) =>
          (a.change_24h_pct ?? 0) < (b.change_24h_pct ?? 0) ? a : b
        )
      : marketCompanies[1] ?? null
  const mostActive =
    marketCompanies.length > 0
      ? marketCompanies.reduce((a, b) =>
          a.market_cap > b.market_cap ? a : b
        )
      : null

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <MarketContent
        companies={marketCompanies}
        topGainer={topGainer}
        topLoser={topLoser}
        mostActive={mostActive}
      />
    </div>
  )
}
