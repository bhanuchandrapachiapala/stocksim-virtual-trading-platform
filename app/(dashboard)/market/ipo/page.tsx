import { createClient } from '@/lib/supabase/server'
import { IPOMarketContent } from './_components/IPOMarketContent'

export default async function IPOMarketPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    return null
  }

  const [iposRes, applicationsRes, userAppRes, userRes] = await Promise.all([
    supabase
      .from('ipos')
      .select('id, company_id, initial_price, shares_offered, shares_applied, subscription_deadline, status, created_at, companies(id, name, ticker, sector, description, current_price)')
      .eq('status', 'open')
      .order('subscription_deadline', { ascending: true }),
    supabase.from('ipo_applications').select('ipo_id, shares_requested'),
    supabase
      .from('ipo_applications')
      .select('ipo_id, shares_requested, amount_paid')
      .eq('user_id', authUser.id),
    supabase.from('users').select('cash_balance').eq('id', authUser.id).single(),
  ])

  const ipos = (iposRes.data ?? []) as Array<{
    id: string
    company_id: string
    initial_price: number
    shares_offered: number
    shares_applied: number
    subscription_deadline: string
    status: string
    created_at: string
    companies: {
      id: string
      name: string
      ticker: string
      sector: string
      description: string
      current_price: number
    } | null
  }>

  const allApplications = (applicationsRes.data ?? []) as Array<{ ipo_id: string; shares_requested: number }>
  const applicationsByIpo: Record<string, number> = {}
  allApplications.forEach((a) => {
    applicationsByIpo[a.ipo_id] = (applicationsByIpo[a.ipo_id] ?? 0) + 1
  })

  const myApplications = (userAppRes.data ?? []) as Array<{
    ipo_id: string
    shares_requested: number
    amount_paid: number
  }>
  const myApplicationByIpo: Record<string, { shares_requested: number; amount_paid: number }> = {}
  myApplications.forEach((a) => {
    myApplicationByIpo[a.ipo_id] = { shares_requested: a.shares_requested, amount_paid: a.amount_paid ?? 0 }
  })

  const cashBalance = (userRes.data as { cash_balance?: number } | null)?.cash_balance ?? 0

  const iposWithMeta = ipos.map((ipo) => ({
    ...ipo,
    applications_count: applicationsByIpo[ipo.id] ?? 0,
    my_application: myApplicationByIpo[ipo.id] ?? null,
  }))

  return (
    <IPOMarketContent
      ipos={iposWithMeta}
      cashBalance={cashBalance}
    />
  )
}
