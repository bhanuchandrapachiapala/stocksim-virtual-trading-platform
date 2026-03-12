'use client'

import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export function SidebarLogoutButton() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="flex w-full items-center gap-3 rounded-lg border-l-2 border-transparent px-3 py-2.5 text-left text-sm font-medium text-red-400 transition-all duration-200 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400"
    >
      <LogOut className="h-5 w-5 shrink-0" />
      Log out
    </button>
  )
}
