'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, BarChart2 } from 'lucide-react'
import { DashboardSidebar } from './DashboardSidebar'
import type { DashboardHeaderUser } from './DashboardHeader'

function formatBalance(n: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

type DashboardShellProps = {
  headerUser: DashboardHeaderUser | null
  isAdmin?: boolean
  children: React.ReactNode
}

export function DashboardShell({
  headerUser,
  isAdmin,
  children,
}: DashboardShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <DashboardSidebar
        isAdmin={isAdmin}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Mobile header bar: hamburger, logo, balance */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between border-b border-white/[0.06] bg-[#0a0a0f] px-4">
        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex h-10 w-10 items-center justify-center rounded-lg text-white hover:bg-white/[0.06]"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>
        <Link
          href="/dashboard"
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2"
        >
          <BarChart2 className="h-6 w-6 shrink-0" style={{ color: '#00ff88' }} />
          <span className="text-lg font-semibold text-white">
            Stock<span style={{ color: '#00ff88' }}>Sim</span>
          </span>
        </Link>
        <div className="min-w-[80px] text-right">
          {headerUser && (
            <span className="text-sm font-medium" style={{ color: '#00ff88' }}>
              {formatBalance(headerUser.cash_balance)}
            </span>
          )}
        </div>
      </div>

      {/* Main: full width on mobile, offset by sidebar on desktop */}
      <main className="min-h-screen pt-14 pl-0 lg:pt-0 lg:pl-[240px]">
        {children}
      </main>
    </div>
  )
}
