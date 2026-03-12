'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Newspaper } from 'lucide-react'

const CARD_STYLE =
  'rounded-xl border border-white/[0.08] bg-white/[0.03] p-5 backdrop-blur-md'

const PREVIEW_LENGTH = 150

type Article = {
  id: string
  title: string
  body: string
  ticker_tags: string[]
  is_pinned: boolean
  created_at: string
}

type NewsContentProps = {
  articles: Article[]
  tickerTags: string[]
}

export function NewsContent({ articles, tickerTags }: NewsContentProps) {
  const [activeFilter, setActiveFilter] = useState<string>('All')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const breaking = articles.find((a) => a.is_pinned) ?? null
  const gridArticles =
    activeFilter === 'All'
      ? articles
      : articles.filter((a) => (a.ticker_tags ?? []).includes(activeFilter))

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Newspaper className="h-8 w-8 text-[#00ff88]" />
        <h1 className="text-2xl font-bold text-white">Market News</h1>
      </div>

      <AnimatePresence>
        {breaking && (
          <motion.article
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className={`${CARD_STYLE} relative overflow-hidden border-[#00ff88]/30 shadow-[0_0_30px_-5px_rgba(0,255,136,0.2)]`}
          >
            <span className="absolute right-4 top-4 flex h-8 items-center gap-1.5 rounded-full bg-red-500/90 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white animate-pulse">
              Breaking
            </span>
            <h2 className="pr-28 text-xl font-bold text-white">{breaking.title}</h2>
            <p className="mt-3 whitespace-pre-wrap text-zinc-300">{breaking.body}</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {(breaking.ticker_tags ?? []).map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-[#00ff88]/20 px-2.5 py-0.5 text-sm font-medium text-[#00ff88]"
                >
                  {t}
                </span>
              ))}
              <span className="text-sm text-zinc-500">
                {formatDate(breaking.created_at)}
              </span>
            </div>
          </motion.article>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setActiveFilter('All')}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
            activeFilter === 'All'
              ? 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40'
              : 'border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-300'
          }`}
        >
          All
        </button>
        {tickerTags.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => setActiveFilter(tag)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeFilter === tag
                ? 'bg-[#00ff88]/20 text-[#00ff88] border border-[#00ff88]/40'
                : 'border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-300'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {gridArticles.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] py-16 backdrop-blur-md"
        >
          <Newspaper className="h-12 w-12 text-zinc-600" />
          <p className="mt-4 text-zinc-400">
            No market news yet. Check back soon.
          </p>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {gridArticles.map((article, i) => {
            const isExpanded = expandedId === article.id
            const preview =
              article.body.length <= PREVIEW_LENGTH
                ? article.body
                : article.body.slice(0, PREVIEW_LENGTH) + '...'
            const hasMore = article.body.length > PREVIEW_LENGTH

            return (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.03 }}
                className={CARD_STYLE}
              >
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-bold text-white">{article.title}</h3>
                  {article.is_pinned && (
                    <span className="shrink-0 rounded bg-[#00ff88]/20 px-2 py-0.5 text-xs font-medium text-[#00ff88]">
                      Pinned
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-sm text-zinc-400">
                    {preview}
                    {!isExpanded && hasMore && (
                      <button
                        type="button"
                        onClick={() => setExpandedId(article.id)}
                        className="ml-1 text-[#00ff88] hover:underline"
                      >
                        Read more
                      </button>
                    )}
                  </p>
                  <AnimatePresence>
                    {isExpanded && hasMore && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        className="overflow-hidden"
                      >
                        <p className="mt-2 whitespace-pre-wrap text-sm text-zinc-400">
                          {article.body.slice(PREVIEW_LENGTH)}
                        </p>
                        <button
                          type="button"
                          onClick={() => setExpandedId(null)}
                          className="mt-1 text-sm text-[#00ff88] hover:underline"
                        >
                          Show less
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {(article.ticker_tags ?? []).map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-[#00ff88]/20 px-2 py-0.5 text-xs font-medium text-[#00ff88]"
                    >
                      {t}
                    </span>
                  ))}
                  <span className="text-xs text-zinc-500">
                    {formatDate(article.created_at)}
                  </span>
                </div>
              </motion.article>
            )
          })}
        </div>
      )}
    </div>
  )
}
