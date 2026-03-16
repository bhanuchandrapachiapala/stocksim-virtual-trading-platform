'use client'

import { usePathname } from 'next/navigation'

const PATH_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/market': 'Market',
  '/orders': 'Orders',
  '/watchlist': 'Watchlist',
  '/news': 'News',
  '/leaderboard': 'Leaderboard',
  '/funds': 'Funds',
  '/bank': 'Bank',
  '/profile': 'Profile',
  '/notifications': 'Notifications',
}

function getPageTitle(pathname: string): string {
  if (pathname in PATH_TITLES) return PATH_TITLES[pathname]
  if (pathname.startsWith('/funds/create')) return 'Create Fund'
  if (pathname.match(/^\/funds\/[^/]+$/)) return 'Fund Details'
  if (pathname.startsWith('/stocks/')) return 'Stock'
  return 'Dashboard'
}

export type DashboardHeaderUser = {
  cash_balance: number
  avatar_url: string | null
  display_name: string
}

type DashboardHeaderProps = {
  user: DashboardHeaderUser | null
}

export function DashboardHeader({ user }: DashboardHeaderProps) {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  const formatBalance = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(n)

  return (
    <header className="sticky top-0 z-30 hidden lg:flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0f] px-6">
      <h1 className="text-lg font-semibold text-white">{title}</h1>
      <div className="flex items-center gap-3">
        {user && (
          <div
            className="flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5"
            style={{ color: '#00ff88' }}
          >
            <span className="text-sm font-medium">
              {formatBalance(user.cash_balance)}
            </span>
            {user.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.avatar_url}
                alt={user.display_name || 'Avatar'}
                width={28}
                height={28}
                className="h-7 w-7 rounded-full object-cover"
              />
            ) : (
              <div
                className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00ff88]/20 text-xs font-medium"
                style={{ color: '#00ff88' }}
              >
                {user.display_name?.charAt(0)?.toUpperCase() ?? '?'}
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
