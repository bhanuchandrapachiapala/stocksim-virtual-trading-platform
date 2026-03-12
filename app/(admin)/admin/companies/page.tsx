import { createClient } from '@/lib/supabase/server'
import { AdminCompaniesContent } from './_components/AdminCompaniesContent'

export default async function AdminCompaniesPage() {
  const supabase = await createClient()
  const { data: companies } = await supabase
    .from('companies')
    .select('id, name, ticker, sector, current_price, shares_available, created_at')
    .order('created_at', { ascending: false })

  const list = (companies ?? []) as Array<{
    id: string
    name: string
    ticker: string
    sector: string
    current_price: number
    shares_available: number
    created_at: string
  }>

  return <AdminCompaniesContent companies={list} />
}
