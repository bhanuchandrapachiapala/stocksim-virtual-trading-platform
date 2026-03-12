import { createClient } from '@/lib/supabase/server'
import { AdminOverviewContent } from './admin/_components/AdminOverviewContent'

export default async function AdminOverviewPage() {
  const supabase = await createClient()

  const [
    usersCountRes,
    ordersCountRes,
    loansCountRes,
    companiesCountRes,
    newsCountRes,
    fundsCountRes,
    recentOrdersRes,
    recentUsersRes,
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
    supabase.from('loans').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('news').select('*', { count: 'exact', head: true }),
    supabase.from('funds').select('*', { count: 'exact', head: true }),
    supabase
      .from('orders')
      .select('id, user_id, quantity, price, created_at, companies(ticker), users(display_name)')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase
      .from('users')
      .select('id, display_name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
  ])

  const stats = {
    users: usersCountRes.count ?? 0,
    trades: ordersCountRes.count ?? 0,
    activeLoans: loansCountRes.count ?? 0,
    companies: companiesCountRes.count ?? 0,
    news: newsCountRes.count ?? 0,
    funds: fundsCountRes.count ?? 0,
  }

  const recentTrades = (recentOrdersRes.data ?? []) as Array<{
    id: string
    user_id: string
    quantity: number
    price: number
    created_at: string
    companies: { ticker: string } | null
    users: { display_name: string } | null
  }>
  const recentUsers = (recentUsersRes.data ?? []) as Array<{
    id: string
    display_name: string
    email: string
    created_at: string
  }>

  return (
    <AdminOverviewContent
      stats={stats}
      recentTrades={recentTrades}
      recentUsers={recentUsers}
    />
  )
}
