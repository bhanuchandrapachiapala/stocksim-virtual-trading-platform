'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Newspaper, Sparkles, Pin, PinOff, Trash2 } from 'lucide-react'

const RED = '#ef4444'
const CARD =
  'rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md'

type Article = {
  id: string
  title: string
  body: string
  ticker_tags: string[]
  is_pinned: boolean
  created_at: string
}

type AdminNewsContentProps = { articles: Article[] }

function parseTags(input: string): string[] {
  return input
    .split(',')
    .map((s) => s.trim().toUpperCase())
    .filter(Boolean)
}

export function AdminNewsContent({ articles: initialArticles }: AdminNewsContentProps) {
  const [articles, setArticles] = useState(initialArticles)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [tagInput, setTagInput] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const tags = parseTags(tagInput)

  async function handleAiAssist() {
    setAiLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/news/ai-assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: body || 'Write a brief market update.' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'AI assist failed')
      setTitle(data.title ?? title)
      setBody(data.body ?? body)
      setSuccess('Article draft generated.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'AI assist failed')
    } finally {
      setAiLoading(false)
    }
  }

  async function handlePost() {
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/admin/news', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          body: body.trim(),
          ticker_tags: tags,
          is_pinned: isPinned,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to post')
      setArticles((prev) => [
        {
          id: data.news.id,
          title: data.news.title,
          body: data.news.body,
          ticker_tags: data.news.ticker_tags ?? [],
          is_pinned: data.news.is_pinned,
          created_at: data.news.created_at,
        },
        ...prev,
      ])
      setTitle('')
      setBody('')
      setTagInput('')
      setIsPinned(false)
      setSuccess('Article posted.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to post')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch('/api/admin/news', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ news_id: id }),
      })
      if (!res.ok) throw new Error('Delete failed')
      setArticles((prev) => prev.filter((a) => a.id !== id))
    } catch {
      setError('Failed to delete')
    }
  }

  async function handleTogglePin(a: Article) {
    try {
      const res = await fetch('/api/admin/news', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ news_id: a.id, is_pinned: !a.is_pinned }),
      })
      if (!res.ok) throw new Error('Update failed')
      setArticles((prev) =>
        prev.map((x) => (x.id === a.id ? { ...x, is_pinned: !x.is_pinned } : x))
      )
    } catch {
      setError('Failed to update pin')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Newspaper className="h-8 w-8" style={{ color: RED }} />
        <h1 className="text-2xl font-bold text-white">Admin News</h1>
      </div>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
          {error}
        </div>
      )}
      {success && (
        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-400">
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={CARD}
        >
          <h2 className="mb-4 font-semibold text-white">Post New Article</h2>
          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Title</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white placeholder-zinc-500 focus:border-[#ef4444] focus:outline-none focus:ring-1 focus:ring-[#ef4444]"
                placeholder="Headline"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Body (markdown-friendly)</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white placeholder-zinc-500 focus:border-[#ef4444] focus:outline-none focus:ring-1 focus:ring-[#ef4444]"
                placeholder="Article content or rough notes for AI..."
              />
            </div>
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Ticker tags (comma separated)</label>
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-white placeholder-zinc-500 focus:border-[#ef4444] focus:outline-none focus:ring-1 focus:ring-[#ef4444]"
                placeholder="AAPL, MSFT, GOOGL"
              />
              {tags.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {tags.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-400"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="rounded border-white/20"
              />
              <span className="text-sm text-zinc-400">Pin this article</span>
            </label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAiAssist}
                disabled={aiLoading}
                className="flex items-center gap-2 rounded-lg border border-[#ef4444]/50 bg-[#ef4444]/10 px-4 py-2 text-sm font-medium text-[#ef4444] hover:bg-[#ef4444]/20 disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {aiLoading ? 'Generating...' : 'Groq AI Assist'}
              </button>
              <button
                type="button"
                onClick={handlePost}
                disabled={loading || !title.trim()}
                className="rounded-lg bg-[#ef4444] px-4 py-2 text-sm font-medium text-white hover:bg-[#ef4444]/90 disabled:opacity-50"
              >
                {loading ? 'Posting...' : 'Post Article'}
              </button>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className={CARD}
        >
          <h2 className="mb-4 font-semibold text-white">Existing Articles</h2>
          <ul className="space-y-3 max-h-[600px] overflow-y-auto">
            {articles.map((a, i) => (
              <motion.li
                key={a.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-lg border border-white/[0.06] bg-black/20 p-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-white">{a.title}</span>
                      {a.is_pinned && (
                        <span className="rounded bg-[#ef4444]/20 px-1.5 py-0.5 text-xs text-[#ef4444]">
                          Pinned
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                    {a.ticker_tags?.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {a.ticker_tags.map((t) => (
                          <span
                            key={t}
                            className="rounded bg-white/10 px-1.5 py-0.5 text-xs text-zinc-400"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleTogglePin(a)}
                      className="rounded p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
                      title={a.is_pinned ? 'Unpin' : 'Pin'}
                    >
                      {a.is_pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(a.id)}
                      className="rounded p-1.5 text-red-400 hover:bg-red-500/20"
                      title="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </motion.li>
            ))}
            {articles.length === 0 && (
              <p className="py-4 text-center text-sm text-zinc-500">No articles yet.</p>
            )}
          </ul>
        </motion.div>
      </div>
    </div>
  )
}
