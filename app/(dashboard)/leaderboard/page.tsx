import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { STARTING_BALANCE } from '@/lib/constants'
import { LeaderboardContent } from './_components/LeaderboardContent'

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const [usersRes, holdingsRes, ordersRes, achievementsRes, fundsRes, fundMembersRes] =
    await Promise.all([
      supabase.from('users').select('id, display_name, avatar_url, cash_balance, is_admin'),
      supabase
        .from('holdings')
        .select('user_id, quantity, companies(current_price)'),
      supabase
        .from('orders')
        .select('user_id')
        .eq('status', 'executed'),
      supabase.from('achievements').select('user_id'),
      supabase
        .from('funds')
        .select('id, name, total_value, manager_id')
        .order('total_value', { ascending: false }),
      supabase.from('fund_members').select('fund_id, contribution'),
    ])

  const users = (usersRes.data ?? []) as unknown as Array<{
    id: string
    display_name: string
    avatar_url: string | null
    cash_balance: number
    is_admin: boolean
  }>
  const holdings = (holdingsRes.data ?? []) as unknown as Array<{
    user_id: string
    quantity: number
    companies: { current_price: number } | null
  }>
  const orders = (ordersRes.data ?? []) as unknown as Array<{ user_id: string }>
  const achievements = (achievementsRes.data ?? []) as unknown as Array<{ user_id: string }>
  const funds = (fundsRes.data ?? []) as unknown as Array<{
    id: string
    name: string
    total_value: number
    manager_id: string
  }>
  const fundMembers = (fundMembersRes.data ?? []) as unknown as Array<{
    fund_id: string
    contribution: number
  }>

  // Net worth is computed live from cash_balance + holdings×prices (no net_worth_snapshots),
  // so every user appears on the leaderboard immediately after joining.
  const portfolioByUser = new Map<string, number>()
  for (const h of holdings) {
    const price = h.companies?.current_price ?? 0
    const val = h.quantity * price
    portfolioByUser.set(h.user_id, (portfolioByUser.get(h.user_id) ?? 0) + val)
  }

  const tradesByUser = new Map<string, number>()
  for (const o of orders) {
    tradesByUser.set(o.user_id, (tradesByUser.get(o.user_id) ?? 0) + 1)
  }

  const achievementsByUser = new Map<string, number>()
  for (const a of achievements) {
    achievementsByUser.set(a.user_id, (achievementsByUser.get(a.user_id) ?? 0) + 1)
  }

  const totalContribByFund = new Map<string, number>()
  for (const m of fundMembers) {
    totalContribByFund.set(
      m.fund_id,
      (totalContribByFund.get(m.fund_id) ?? 0) + (m.contribution ?? 0)
    )
  }

  const managerIds = [...new Set(funds.map((f) => f.manager_id))]
  const { data: managerRows } =
    managerIds.length > 0
      ? await supabase.from('users').select('id, display_name').in('id', managerIds)
      : { data: [] }
  const managerById = new Map(
    (managerRows ?? []).map((r: { id: string; display_name: string }) => [
      r.id,
      r.display_name,
    ])
  )

  const memberCountByFund = new Map<string, number>()
  for (const m of fundMembers) {
    memberCountByFund.set(m.fund_id, (memberCountByFund.get(m.fund_id) ?? 0) + 1)
  }

  const traders = users
    .filter((u) => !u.is_admin)
    .map((u) => {
      const cash = u.cash_balance ?? 0
      const portfolio = portfolioByUser.get(u.id) ?? 0
      const netWorth = cash + portfolio
      const pnlPct =
        STARTING_BALANCE > 0
          ? ((netWorth - STARTING_BALANCE) / STARTING_BALANCE) * 100
          : 0
      return {
        id: u.id,
        display_name: u.display_name ?? 'Unknown',
        avatar_url: u.avatar_url,
        net_worth: netWorth,
        pnl_pct: pnlPct,
        trades: tradesByUser.get(u.id) ?? 0,
        achievements: achievementsByUser.get(u.id) ?? 0,
      }
    })

  traders.sort((a, b) => b.net_worth - a.net_worth)

  const rankByUserId = new Map<string, number>()
  traders.forEach((t, i) => rankByUserId.set(t.id, i + 1))

  const currentUserRank = rankByUserId.get(authUser.id) ?? 0
  const currentUserData = traders.find((t) => t.id === authUser.id)

  const fundsWithMeta = funds.map((f, i) => {
    const totalContrib = totalContribByFund.get(f.id) ?? 0
    const roi =
      totalContrib > 0
        ? ((f.total_value - totalContrib) / totalContrib) * 100
        : 0
    return {
      ...f,
      rank: i + 1,
      manager_name: managerById.get(f.manager_id) ?? 'Unknown',
      member_count: memberCountByFund.get(f.id) ?? 0,
      roi,
    }
  })

  return (
    <LeaderboardContent
      traders={traders}
      funds={fundsWithMeta}
      currentUserId={authUser.id}
      currentUserRank={currentUserRank}
      currentUserNetWorth={currentUserData?.net_worth ?? 0}
      totalPlayers={traders.length}
    />
  )
}
