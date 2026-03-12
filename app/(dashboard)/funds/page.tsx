import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { FundsListContent } from './_components/FundsListContent'

export default async function FundsPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const { data: funds } = await supabase
    .from('funds')
    .select('id, name, description, manager_id, total_value, fee_percent, min_buy_in, created_at')
    .order('created_at', { ascending: false })

  const fundList = (funds ?? []) as Array<{
    id: string
    name: string
    description: string
    manager_id: string
    total_value: number
    fee_percent: number
    min_buy_in: number
    created_at: string
  }>

  const managerIds = [...new Set(fundList.map((f) => f.manager_id))]
  const { data: managerRows } = managerIds.length
    ? await supabase.from('users').select('id, display_name').in('id', managerIds)
    : { data: [] }
  const managerById = new Map(
    (managerRows ?? []).map((r: { id: string; display_name: string }) => [r.id, r.display_name])
  )

  const fundIds = fundList.map((f) => f.id)
  const [memberCountsRes, contributionsRes, myMembershipsRes] = await Promise.all([
    supabase.from('fund_members').select('fund_id').in('fund_id', fundIds),
    fundIds.length
      ? supabase.from('fund_members').select('fund_id, contribution').in('fund_id', fundIds)
      : { data: [] as { fund_id: string; contribution: number }[] },
    supabase.from('fund_members').select('fund_id').eq('user_id', authUser.id),
  ])

  const memberCountByFund = new Map<string, number>()
  for (const row of memberCountsRes.data ?? []) {
    const fid = (row as { fund_id: string }).fund_id
    memberCountByFund.set(fid, (memberCountByFund.get(fid) ?? 0) + 1)
  }

  const totalContribByFund = new Map<string, number>()
  for (const row of contributionsRes.data ?? []) {
    const r = row as { fund_id: string; contribution: number }
    totalContribByFund.set(r.fund_id, (totalContribByFund.get(r.fund_id) ?? 0) + (r.contribution ?? 0))
  }

  const myFundIds = new Set(((myMembershipsRes.data ?? []) as { fund_id: string }[]).map((m) => m.fund_id))

  const fundsWithMeta = fundList.map((f) => {
    const totalContrib = totalContribByFund.get(f.id) ?? 0
    const roi =
      totalContrib > 0
        ? ((f.total_value - totalContrib) / totalContrib) * 100
        : 0
    return {
      ...f,
      manager_name: managerById.get(f.manager_id) ?? 'Unknown',
      member_count: memberCountByFund.get(f.id) ?? 0,
      total_contributions: totalContrib,
      roi,
      is_member: myFundIds.has(f.id),
    }
  })

  const totalFunds = fundsWithMeta.length
  const myActiveCount = fundsWithMeta.filter((f) => f.is_member).length
  const bestPerforming =
    fundsWithMeta.filter((f) => f.total_contributions > 0).sort((a, b) => b.roi - a.roi)[0] ?? null

  return (
    <FundsListContent
      funds={fundsWithMeta}
      totalFunds={totalFunds}
      myActiveCount={myActiveCount}
      bestPerforming={bestPerforming}
    />
  )
}
