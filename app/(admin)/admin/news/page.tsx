import { createClient } from '@/lib/supabase/server'
import { AdminNewsContent } from './_components/AdminNewsContent'

export default async function AdminNewsPage() {
  const supabase = await createClient()
  const { data: news } = await supabase
    .from('news')
    .select('id, title, body, ticker_tags, is_pinned, created_at')
    .order('created_at', { ascending: false })

  const articles = (news ?? []) as Array<{
    id: string
    title: string
    body: string
    ticker_tags: string[]
    is_pinned: boolean
    created_at: string
  }>

  return <AdminNewsContent articles={articles} />
}
