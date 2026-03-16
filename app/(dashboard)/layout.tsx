import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from './_components/DashboardHeader'
import { DashboardShell } from './_components/DashboardShell'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser()

  if (!authUser) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('users')
    .select('cash_balance, avatar_url, display_name, is_admin')
    .eq('id', authUser.id)
    .single()

  const headerUser = profile
    ? {
        cash_balance: profile.cash_balance ?? 0,
        avatar_url: profile.avatar_url ?? null,
        display_name: profile.display_name ?? authUser.email ?? 'User',
      }
    : {
        cash_balance: 0,
        avatar_url: null as string | null,
        display_name: authUser.email ?? 'User',
      }

  return (
    <DashboardShell headerUser={headerUser} isAdmin={profile?.is_admin === true}>
      <DashboardHeader user={headerUser} />
      <div className="p-4 sm:p-6 pb-8">{children}</div>
    </DashboardShell>
  )
}
