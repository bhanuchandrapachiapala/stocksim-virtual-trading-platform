'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Bell,
  TrendingUp,
  Landmark,
  Newspaper,
  Users,
  Trophy,
  AlertTriangle,
  Check,
} from 'lucide-react'

const CARD_STYLE =
  'rounded-xl border border-white/[0.08] bg-white/[0.03] p-4 backdrop-blur-md'

function relativeTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const sec = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (sec < 60) return 'Just now'
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr} hour${hr === 1 ? '' : 's'} ago`
  const d = Math.floor(hr / 24)
  if (d < 7) return `${d} day${d === 1 ? '' : 's'} ago`
  return date.toLocaleDateString()
}

function getIconAndColor(type: string) {
  switch (type) {
    case 'price_alert':
      return { Icon: TrendingUp, color: 'text-[#00ff88]' }
    case 'loan_due':
      return { Icon: Landmark, color: 'text-amber-400' }
    case 'news_posted':
      return { Icon: Newspaper, color: 'text-blue-400' }
    case 'fund_trade':
      return { Icon: Users, color: 'text-[#00ff88]' }
    case 'achievement':
      return { Icon: Trophy, color: 'text-[#00ff88]' }
    case 'loan_defaulted':
      return { Icon: AlertTriangle, color: 'text-red-400' }
    default:
      return { Icon: Bell, color: 'text-zinc-400' }
  }
}

type NotificationItem = {
  id: string
  type: string
  message: string
  is_read: boolean
  created_at: string
}

type NotificationsContentProps = {
  unread: NotificationItem[]
  earlier: NotificationItem[]
}

export function NotificationsContent({ unread, earlier }: NotificationsContentProps) {
  const router = useRouter()
  const [markingAll, setMarkingAll] = useState(false)
  const [markingId, setMarkingId] = useState<string | null>(null)

  const handleMarkRead = async (id: string) => {
    setMarkingId(id)
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: id }),
      })
      if (!res.ok) throw new Error('Failed')
      router.refresh()
    } finally {
      setMarkingId(null)
    }
  }

  const handleMarkAllRead = async () => {
    setMarkingAll(true)
    try {
      const res = await fetch('/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ all: true }),
      })
      if (!res.ok) throw new Error('Failed')
      router.refresh()
    } finally {
      setMarkingAll(false)
    }
  }

  const totalUnread = unread.length
  const isEmpty = unread.length === 0 && earlier.length === 0

  if (isEmpty) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Bell className="h-8 w-8 text-[#00ff88]" />
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
        </div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] py-16 backdrop-blur-md"
        >
          <Check className="h-14 w-14 text-[#00ff88]" />
          <p className="mt-4 text-zinc-400">You are all caught up!</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-8 w-8 text-[#00ff88]" />
          <h1 className="text-2xl font-bold text-white">Notifications</h1>
          {totalUnread > 0 && (
            <span className="rounded-full bg-[#00ff88]/20 px-2.5 py-0.5 text-sm font-medium text-[#00ff88]">
              {totalUnread}
            </span>
          )}
        </div>
        {totalUnread > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={markingAll}
            className="rounded-lg bg-[#00ff88]/20 px-4 py-2 text-sm font-medium text-[#00ff88] transition-colors hover:bg-[#00ff88]/30 disabled:opacity-50"
          >
            {markingAll ? 'Updating…' : 'Mark All as Read'}
          </button>
        )}
      </div>

      {unread.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
            Unread
          </h2>
          <ul className="space-y-2">
            {unread.map((n, i) => (
              <NotificationCard
                key={n.id}
                notification={n}
                index={i}
                onMarkRead={handleMarkRead}
                markingId={markingId}
              />
            ))}
          </ul>
        </section>
      )}

      {earlier.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-500">
            Earlier
          </h2>
          <ul className="space-y-2">
            {earlier.map((n, i) => (
              <NotificationCard
                key={n.id}
                notification={n}
                index={i}
                onMarkRead={handleMarkRead}
                markingId={markingId}
                isRead
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}

function NotificationCard({
  notification,
  index,
  onMarkRead,
  markingId,
  isRead = false,
}: {
  notification: NotificationItem
  index: number
  onMarkRead: (id: string) => void
  markingId: string | null
  isRead?: boolean
}) {
  const { Icon, color } = getIconAndColor(notification.type)
  return (
    <motion.li
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
    >
      <button
        type="button"
        onClick={() => !isRead && onMarkRead(notification.id)}
        className={`w-full rounded-xl border p-4 text-left backdrop-blur-md transition-colors ${
          isRead
            ? 'border-white/[0.08] bg-white/[0.03]'
            : 'border-l-4 border-l-[#00ff88]/50 border-white/[0.08] bg-white/[0.06] hover:bg-white/[0.08]'
        }`}
      >
        <div className="flex gap-3">
          <div className={`shrink-0 ${color}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white">{notification.message}</p>
            <p className="mt-1 text-xs text-zinc-500">
              {relativeTime(notification.created_at)}
            </p>
          </div>
          {!isRead && markingId === notification.id && (
            <span className="text-xs text-zinc-500">Marking…</span>
          )}
        </div>
      </button>
    </motion.li>
  )
}
