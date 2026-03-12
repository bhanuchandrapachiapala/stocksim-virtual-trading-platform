import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { OrdersContent } from './_components/OrdersContent'

export default async function OrdersPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const { data: orders } = await supabase
    .from('orders')
    .select('id, company_id, side, order_type, quantity, price, status, created_at, executed_at, companies(name, ticker, current_price)')
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false })

  const list = (orders ?? []) as Array<{
    id: string
    company_id: string
    side: string
    order_type: string
    quantity: number
    price: number
    status: string
    created_at: string
    executed_at: string | null
    companies: { name: string; ticker: string; current_price: number } | null
  }>

  const openOrders = list.filter((o) => o.status === 'pending')
  const orderHistory = list.filter((o) => o.status !== 'pending')

  return (
    <OrdersContent
      openOrders={openOrders}
      orderHistory={orderHistory}
    />
  )
}
