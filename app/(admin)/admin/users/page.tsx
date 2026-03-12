import { createClient } from '@/lib/supabase/server'
import { AdminUsersContent } from './_components/AdminUsersContent'

export default async function AdminUsersPage() {
  const supabase = await createClient()

  const [usersRes, holdingsRes, ordersRes, loansRes] = await Promise.all([
    supabase.from('users').select('id, display_name, email, avatar_url, cash_balance, is_bankrupt, created_at').order('created_at', { ascending: false }),
    supabase.from('holdings').select('user_id, quantity, companies(current_price)'),
    supabase.from('orders').select('user_id'),
    supabase.from('loans').select('user_id, status').eq('status', 'active'),
  ])

  const users = (usersRes.data ?? []) as unknown as Array<{
    id: string
    display_name: string
    email: string
    avatar_url: string | null
    cash_balance: number
    is_bankrupt: boolean
    created_at: string
  }>

  const holdings = (holdingsRes.data ?? []) as unknown as Array<{
    user_id: string
    quantity: number
    companies: { current_price: number } | null
  }>

  const orders = (ordersRes.data ?? []) as unknown as Array<{ user_id: string }>
  const activeLoans = (loansRes.data ?? []) as unknown as Array<{ user_id: string }>

  const portfolioByUser: Record<string, number> = {}
  holdings.forEach((h) => {
    const price = h.companies?.current_price ?? 0
    portfolioByUser[h.user_id] = (portfolioByUser[h.user_id] ?? 0) + h.quantity * price
  })

  const tradesByUser: Record<string, number> = {}
  orders.forEach((o) => {
    tradesByUser[o.user_id] = (tradesByUser[o.user_id] ?? 0) + 1
  })

  const hasActiveLoan = new Set(activeLoans.map((l) => l.user_id))

  const usersWithStats = users.map((u) => ({
    ...u,
    net_worth: (u.cash_balance ?? 0) + (portfolioByUser[u.id] ?? 0),
    trades_count: tradesByUser[u.id] ?? 0,
    has_active_loan: hasActiveLoan.has(u.id),
  }))

  return <AdminUsersContent users={usersWithStats} />
}
