import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { STARTING_BALANCE } from '@/lib/constants'
import { ProfileContent } from './_components/ProfileContent'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const [
    userRes,
    holdingsRes,
    snapshotsRes,
    achievementsRes,
    ordersCountRes,
    fundsRes,
    transactionsRes,
    allUsersRes,
    allHoldingsRes,
  ] = await Promise.all([
    supabase
      .from('users')
      .select('id, display_name, email, avatar_url, cash_balance, created_at, is_bankrupt')
      .eq('id', authUser.id)
      .single(),
    supabase
      .from('holdings')
      .select('quantity, companies(sector, current_price)')
      .eq('user_id', authUser.id),
    supabase
      .from('net_worth_snapshots')
      .select('value, recorded_at')
      .eq('user_id', authUser.id)
      .order('recorded_at', { ascending: true }),
    supabase.from('achievements').select('badge_name, earned_at').eq('user_id', authUser.id),
    supabase.from('orders').select('*', { count: 'exact', head: true }).eq('user_id', authUser.id),
    supabase.from('fund_members').select('id').eq('user_id', authUser.id),
    supabase
      .from('transactions')
      .select('id, type, amount, description, created_at')
      .eq('user_id', authUser.id)
      .order('created_at', { ascending: false }),
    supabase.from('users').select('id, cash_balance'),
    supabase.from('holdings').select('user_id, quantity, companies(current_price)'),
  ])

  const user = userRes.data as {
    id: string
    display_name: string
    email: string
    avatar_url: string | null
    cash_balance: number
    created_at: string
    is_bankrupt: boolean
  } | null

  if (!user) {
    redirect('/login')
  }

  const holdings = (holdingsRes.data ?? []) as unknown as Array<{
    quantity: number
    companies: { sector: string; current_price: number } | null
  }>
  const portfolioValue = holdings.reduce((sum, h) => {
    const p = h.companies?.current_price ?? 0
    return sum + h.quantity * p
  }, 0)
  const netWorth = (user.cash_balance ?? 0) + portfolioValue
  const pnlPct =
    STARTING_BALANCE > 0
      ? ((netWorth - STARTING_BALANCE) / STARTING_BALANCE) * 100
      : 0
  const joinedAt = new Date(user.created_at)
  const daysActive = Math.max(
    0,
    Math.floor((Date.now() - joinedAt.getTime()) / (1000 * 60 * 60 * 24))
  )

  const snapshots = (snapshotsRes.data ?? []) as unknown as Array<{
    value: number
    recorded_at: string
  }>
  const achievements = (achievementsRes.data ?? []) as unknown as Array<{
    badge_name: string
    earned_at: string
  }>
  const totalTrades = typeof ordersCountRes.count === 'number' ? ordersCountRes.count : 0
  const fundsCount = (fundsRes.data ?? []).length
  const transactions = (transactionsRes.data ?? []) as unknown as Array<{
    id: string
    type: string
    amount: number
    description: string
    created_at: string
  }>

  const allUsers = (allUsersRes.data ?? []) as unknown as Array<{ id: string; cash_balance: number }>
  const allHoldings = (allHoldingsRes.data ?? []) as unknown as Array<{
    user_id: string
    quantity: number
    companies: { current_price: number } | null
  }>
  const portfolioByUser = new Map<string, number>()
  for (const h of allHoldings) {
    const p = h.companies?.current_price ?? 0
    portfolioByUser.set(
      h.user_id,
      (portfolioByUser.get(h.user_id) ?? 0) + h.quantity * p
    )
  }
  const netWorthByUser = new Map<string, number>()
  for (const u of allUsers) {
    netWorthByUser.set(
      u.id,
      (u.cash_balance ?? 0) + (portfolioByUser.get(u.id) ?? 0)
    )
  }
  const rank =
    1 +
    [...netWorthByUser.values()].filter((nw) => nw > netWorth).length

  const sectorValues = new Map<string, number>()
  for (const h of holdings) {
    const sector = h.companies?.sector ?? 'Other'
    const val = h.quantity * (h.companies?.current_price ?? 0)
    sectorValues.set(sector, (sectorValues.get(sector) ?? 0) + val)
  }
  const portfolioBreakdown = [...sectorValues.entries()].map(([name, value]) => ({
    name,
    value,
  }))

  const allBadges = [
    'First Trade',
    'Diversified',
    'Whale',
    'Loan Shark Survivor',
    'Fund Manager',
    'Bear Survivor',
    'Top 10',
  ]
  const earnedSet = new Set(achievements.map((a) => a.badge_name))
  const achievementsWithEarned = allBadges.map((name) => ({
    name,
    earned: earnedSet.has(name),
    earned_at: achievements.find((a) => a.badge_name === name)?.earned_at ?? null,
  }))

  return (
    <ProfileContent
      user={{
        display_name: user.display_name ?? '',
        email: user.email ?? '',
        avatar_url: user.avatar_url,
        cash_balance: user.cash_balance ?? 0,
        created_at: user.created_at,
        is_bankrupt: user.is_bankrupt ?? false,
      }}
      netWorth={netWorth}
      pnlPct={pnlPct}
      daysActive={daysActive}
      rank={rank}
      totalTrades={totalTrades}
      fundsCount={fundsCount}
      snapshots={snapshots}
      portfolioBreakdown={portfolioBreakdown}
      achievements={achievementsWithEarned}
      transactions={transactions}
    />
  )
}
