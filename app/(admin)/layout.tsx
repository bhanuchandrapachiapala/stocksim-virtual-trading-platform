import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AdminSidebar } from './_components/AdminSidebar'

export default async function AdminLayout({
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

  const isAdmin = (authUser.app_metadata?.is_admin as boolean) === true
  if (!isAdmin) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <AdminSidebar />
      <main className="pl-[240px]">
        <div className="border-b border-white/[0.06] bg-[#0a0a0f] px-6 py-4">
          <h1 className="text-lg font-semibold text-white">Admin</h1>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
