'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  TrendingUp,
  ClipboardList,
  Star,
  Newspaper,
  Trophy,
  Users,
  Landmark,
  UserCircle,
  Bell,
  BarChart2,
  Shield,
} from 'lucide-react'
import { SidebarLogoutButton } from './SidebarLogoutButton'

const NAV_ITEMS = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/market', icon: TrendingUp, label: 'Market' },
  { href: '/orders', icon: ClipboardList, label: 'Orders' },
  { href: '/watchlist', icon: Star, label: 'Watchlist' },
  { href: '/news', icon: Newspaper, label: 'News' },
  { href: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
  { href: '/funds', icon: Users, label: 'Funds' },
  { href: '/bank', icon: Landmark, label: 'Bank' },
  { href: '/profile', icon: UserCircle, label: 'Profile' },
  { href: '/notifications', icon: Bell, label: 'Notifications' },
] as const

type DashboardSidebarProps = {
  isAdmin?: boolean
}

export function DashboardSidebar({ isAdmin }: DashboardSidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[240px] border-r border-white/[0.06] bg-[#111118]/90 backdrop-blur-xl">
      <div className="flex h-full flex-col">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 border-b border-white/[0.06] px-6 py-5 transition-colors hover:opacity-90"
        >
          <BarChart2 className="h-6 w-6 shrink-0" style={{ color: '#00ff88' }} />
          <span className="text-lg font-semibold text-white">
            Stock<span style={{ color: '#00ff88' }}>Sim</span>
          </span>
        </Link>

        <nav className="flex-1 space-y-0.5 p-3">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive =
              pathname === href ||
              (href !== '/dashboard' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'border-l-2 border-[#00ff88] bg-[#00ff88]/10 text-[#00ff88]'
                    : 'border-l-2 border-transparent text-zinc-400 hover:border-[#00ff88]/50 hover:bg-white/[0.04] hover:text-[#00ff88]'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </Link>
            )
          })}

          {isAdmin && (
            <Link
              href="/admin"
              className={`mt-2 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                pathname === '/admin' || pathname.startsWith('/admin')
                  ? 'border-l-2 border-red-500 bg-red-500/10 text-red-400'
                  : 'border-l-2 border-transparent text-red-500/80 hover:border-red-500/60 hover:bg-red-500/5 hover:text-red-400'
              }`}
            >
              <Shield className="h-5 w-5 shrink-0" />
              Admin Panel
            </Link>
          )}
        </nav>

        <div className="border-t border-white/[0.06] p-3">
          <SidebarLogoutButton />
        </div>
      </div>
    </aside>
  )
}
