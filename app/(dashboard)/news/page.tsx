import { createClient } from '@/lib/supabase/server'
import { NewsContent } from './_components/NewsContent'

export default async function NewsPage() {
  const supabase = await createClient()
  const { data: news } = await supabase
    .from('news')
    .select('id, title, body, ticker_tags, is_pinned, created_at')
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  const articles = (news ?? []) as unknown as Array<{
    id: string
    title: string
    body: string
    ticker_tags: string[]
    is_pinned: boolean
    created_at: string
  }>

  const allTags = [...new Set(articles.flatMap((a) => a.ticker_tags ?? []))].sort()

  return (
    <NewsContent
      articles={articles}
      tickerTags={allTags}
    />
  )
}
