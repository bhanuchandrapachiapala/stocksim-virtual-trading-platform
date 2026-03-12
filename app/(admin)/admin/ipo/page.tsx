import { createClient } from '@/lib/supabase/server'
import { AdminIPOContent } from './_components/AdminIPOContent'

export default async function AdminIPOPage() {
  const supabase = await createClient()

  const [iposRes, companiesRes, applicationsCountRes] = await Promise.all([
    supabase
      .from('ipos')
      .select('id, company_id, initial_price, shares_offered, shares_applied, subscription_deadline, status, created_at, companies(id, name, ticker)')
      .order('created_at', { ascending: false }),
    supabase.from('companies').select('id, name, ticker').eq('is_ipo', false),
    supabase.from('ipo_applications').select('ipo_id'),
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
    companies: { id: string; name: string; ticker: string } | null
  }>

  const companiesNotInIpo = (companiesRes.data ?? []) as Array<{
    id: string
    name: string
    ticker: string
  }>

  const appCounts = (applicationsCountRes.data ?? []).reduce(
    (acc: Record<string, number>, row: { ipo_id: string }) => {
      acc[row.ipo_id] = (acc[row.ipo_id] ?? 0) + 1
      return acc
    },
    {}
  )

  const iposWithCount = ipos.map((ipo) => ({
    ...ipo,
    applications_count: appCounts[ipo.id] ?? 0,
  }))

  return (
    <AdminIPOContent
      ipos={iposWithCount}
      companiesNotInIpo={companiesNotInIpo}
    />
  )
}
