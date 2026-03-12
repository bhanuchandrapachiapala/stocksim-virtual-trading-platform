import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { DashboardHeader } from './_components/DashboardHeader'
import { DashboardSidebar } from './_components/DashboardSidebar'

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
    .select('cash_balance, avatar_url, display_name')
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
    <div className="min-h-screen bg-[#0a0a0f]">
      <DashboardSidebar />
      <main className="pl-[240px]">
        <DashboardHeader user={headerUser} />
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
