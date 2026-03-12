'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Newspaper,
  Building2,
  TrendingUp,
  Users,
  Shield,
} from 'lucide-react'

const NAV_ITEMS = [
  { href: '/admin', icon: LayoutDashboard, label: 'Overview' },
  { href: '/admin/news', icon: Newspaper, label: 'News' },
  { href: '/admin/companies', icon: Building2, label: 'Companies' },
  { href: '/admin/ipo', icon: TrendingUp, label: 'IPO' },
  { href: '/admin/users', icon: Users, label: 'Users' },
] as const

const RED_ACCENT = '#ef4444'

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 z-40 h-screen w-[240px] border-r border-white/[0.06] bg-[#111118]/90 backdrop-blur-xl">
      <div className="flex h-full flex-col">
        <div className="flex items-center gap-2 border-b border-white/[0.06] px-6 py-5">
          <Shield className="h-6 w-6 shrink-0" style={{ color: RED_ACCENT }} />
          <span className="text-lg font-semibold text-white">
            Admin <span style={{ color: RED_ACCENT }}>Panel</span>
          </span>
        </div>

        <nav className="flex-1 space-y-0.5 p-3">
          {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
            const isActive =
              (href === '/admin' && pathname === '/admin') ||
              (href !== '/admin' && pathname.startsWith(href))
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'border-l-2 border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444]'
                    : 'border-l-2 border-transparent text-zinc-400 hover:border-[#ef4444]/50 hover:bg-white/[0.04] hover:text-[#ef4444]'
                }`}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {label}
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}
