'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
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
  mobileOpen?: boolean
  onMobileClose?: () => void
}

function NavContent({
  pathname,
  isAdmin,
  onNavClick,
}: {
  pathname: string
  isAdmin: boolean
  onNavClick?: () => void
}) {
  return (
    <>
      <Link
        href="/dashboard"
        className="flex items-center gap-2 border-b border-white/[0.06] px-6 py-5 transition-colors hover:opacity-90"
        onClick={onNavClick}
      >
        <BarChart2 className="h-6 w-6 shrink-0" style={{ color: '#00ff88' }} />
        <span className="text-lg font-semibold text-white">
          Stock<span style={{ color: '#00ff88' }}>Sim</span>
        </span>
      </Link>

      <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive =
            pathname === href ||
            (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={onNavClick}
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
            onClick={onNavClick}
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

      <div className="border-t border-white/[0.06] p-3 shrink-0">
        <SidebarLogoutButton />
      </div>
    </>
  )
}

export function DashboardSidebar({
  isAdmin,
  mobileOpen = false,
  onMobileClose,
}: DashboardSidebarProps) {
  const pathname = usePathname()

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <NavContent
        pathname={pathname}
        isAdmin={!!isAdmin}
        onNavClick={onMobileClose}
      />
    </div>
  )

  return (
    <>
      {/* Desktop: fixed sidebar (hidden on mobile) */}
      <aside
        className="fixed left-0 top-0 z-40 h-screen w-[240px] border-r border-white/[0.06] bg-[#111118]/90 backdrop-blur-xl hidden lg:block"
        aria-hidden={undefined}
      >
        {sidebarContent}
      </aside>

      {/* Mobile: overlay backdrop + sliding sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 lg:hidden"
            aria-hidden="true"
            onClick={onMobileClose}
          />
        )}
        {mobileOpen && (
          <motion.aside
            key="mobile-drawer"
            initial={{ x: -240 }}
            animate={{ x: 0 }}
            exit={{ x: -240 }}
            transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
            className="fixed left-0 top-0 z-50 h-screen w-[240px] border-r border-white/[0.06] bg-[#111118] shadow-xl lg:hidden"
            aria-modal="true"
            aria-label="Navigation menu"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>
    </>
  )
}
