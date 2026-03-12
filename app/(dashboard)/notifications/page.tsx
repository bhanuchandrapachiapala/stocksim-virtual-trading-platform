import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NotificationsContent } from './_components/NotificationsContent'

export default async function NotificationsPage() {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const { data: notifications } = await supabase
    .from('notifications')
    .select('id, type, message, is_read, created_at')
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false })

  const list = (notifications ?? []) as unknown as Array<{
    id: string
    type: string
    message: string
    is_read: boolean
    created_at: string
  }>

  const unread = list.filter((n) => !n.is_read)
  const earlier = list.filter((n) => n.is_read)

  return (
    <NotificationsContent
      unread={unread}
      earlier={earlier}
    />
  )
}
