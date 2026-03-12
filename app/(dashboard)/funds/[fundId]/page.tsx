import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FundDetailContent } from './_components/FundDetailContent'

type PageProps = { params: Promise<{ fundId: string }> }

export default async function FundDetailPage({ params }: PageProps) {
  const { fundId } = await params
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    notFound()
  }

  const { data: fund, error: fundError } = await supabase
    .from('funds')
    .select('id, name, description, manager_id, total_value, fee_percent, min_buy_in, created_at')
    .eq('id', fundId)
    .single()

  if (fundError || !fund) {
    notFound()
  }

  const fundRow = fund as {
    id: string
    name: string
    description: string
    manager_id: string
    total_value: number
    fee_percent: number
    min_buy_in: number
    created_at: string
  }

  const { data: managerUser } = await supabase
    .from('users')
    .select('display_name')
    .eq('id', fundRow.manager_id)
    .single()
  const managerName = (managerUser as { display_name: string } | null)?.display_name ?? 'Unknown'

  const [holdingsRes, membersRes, myMemberRes] = await Promise.all([
    supabase
      .from('fund_holdings')
      .select('id, company_id, quantity, avg_buy_price, companies(id, name, ticker, current_price)')
      .eq('fund_id', fundId),
    supabase
      .from('fund_members')
      .select('id, user_id, contribution, joined_at, users(display_name)')
      .eq('fund_id', fundId),
    supabase
      .from('fund_members')
      .select('id, contribution')
      .eq('fund_id', fundId)
      .eq('user_id', authUser.id)
      .maybeSingle(),
  ])

  const holdings = (holdingsRes.data ?? []) as Array<{
    id: string
    company_id: string
    quantity: number
    avg_buy_price: number
    companies: { id: string; name: string; ticker: string; current_price: number } | null
  }>

  const members = (membersRes.data ?? []) as Array<{
    id: string
    user_id: string
    contribution: number
    joined_at: string
    users: { display_name: string } | null
  }>

  const totalContributions = members.reduce((s, m) => s + m.contribution, 0)
  const fundRoi =
    totalContributions > 0
      ? ((fundRow.total_value - totalContributions) / totalContributions) * 100
      : 0

  const membersWithValue = members.map((m) => {
    const share = totalContributions > 0 ? m.contribution / totalContributions : 0
    const currentValue = fundRow.total_value * share
    const roi = m.contribution > 0 ? ((currentValue - m.contribution) / m.contribution) * 100 : 0
    return {
      ...m,
      display_name: m.users?.display_name ?? 'Unknown',
      current_value: currentValue,
      roi,
    }
  })

  const holdingsWithValue = holdings.map((h) => {
    const company = h.companies
    const currentPrice = company?.current_price ?? 0
    const value = h.quantity * currentPrice
    const costBasis = h.quantity * h.avg_buy_price
    const pnlPct = costBasis > 0 ? ((value - costBasis) / costBasis) * 100 : 0
    return {
      ...h,
      company_name: company?.name ?? '—',
      ticker: company?.ticker ?? '—',
      current_price: currentPrice,
      value,
      pnl_pct: pnlPct,
    }
  })

  const myMembership = myMemberRes.data as { id: string; contribution: number } | null
  const isManager = fundRow.manager_id === authUser.id
  const isMember = !!myMembership

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name, ticker, current_price')
    .order('ticker')

  return (
    <FundDetailContent
      fund={{
        id: fundRow.id,
        name: fundRow.name,
        description: fundRow.description,
        manager_id: fundRow.manager_id,
        manager_name: managerName,
        total_value: fundRow.total_value,
        fee_percent: fundRow.fee_percent,
        min_buy_in: fundRow.min_buy_in,
        roi: fundRoi,
      }}
      holdings={holdingsWithValue}
      members={membersWithValue}
      myMembership={myMembership}
      isManager={isManager}
      isMember={isMember}
      companies={(companies ?? []) as Array<{ id: string; name: string; ticker: string; current_price: number }>}
    />
  )
}
