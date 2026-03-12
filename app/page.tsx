'use client'

import Link from 'next/link'
import { useRef } from 'react'
import { useInView } from 'framer-motion'
import { motion } from 'framer-motion'
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Landmark,
  Rocket,
  Trophy,
  BarChart2,
  Building2,
  DollarSign,
  Globe,
} from 'lucide-react'

const GREEN = '#00ff88'
const CARD_STYLE =
  'rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl'

const STATS = [
  { value: 25, suffix: '+', label: 'Companies', icon: Building2 },
  { value: 1, suffix: '', label: 'Real-time Prices', icon: TrendingUp },
  { value: 9000, prefix: '$', suffix: '', label: 'Starting Balance', icon: DollarSign },
  { value: 1, suffix: '', label: 'Global Leaderboard', icon: Globe },
]

const FEATURES = [
  {
    icon: LayoutDashboard,
    title: 'Portfolio Dashboard',
    description: 'Track your holdings, P&L, and net worth in real time',
  },
  {
    icon: TrendingUp,
    title: 'Live Trading',
    description: 'Buy and sell 25+ fictional companies with real price impact',
  },
  {
    icon: Users,
    title: 'Mutual Funds',
    description: 'Create or join funds, pool capital, and invest together',
  },
  {
    icon: Landmark,
    title: 'Banking System',
    description: 'Take virtual loans up to 50% of your net worth',
  },
  {
    icon: Rocket,
    title: 'IPO Market',
    description: 'Apply for shares in new companies before they list',
  },
  {
    icon: Trophy,
    title: 'Leaderboard',
    description: 'Compete globally and climb the ranks',
  },
]

const STEPS = [
  {
    num: 1,
    icon: BarChart2,
    title: 'Create Account',
    description: 'Get $9,000 virtual cash instantly',
  },
  {
    num: 2,
    icon: TrendingUp,
    title: 'Browse the Market',
    description: '25+ companies across 10 sectors',
  },
  {
    num: 3,
    icon: Trophy,
    title: 'Trade and Compete',
    description: 'Build your portfolio and climb the leaderboard',
  },
]

const TICKER_COMPANIES = [
  { ticker: 'TECH', name: 'TechNova Inc', price: 142.5, change: 2.34 },
  { ticker: 'FINX', name: 'FinanceHub', price: 89.2, change: -0.8 },
  { ticker: 'HEAL', name: 'HealthFirst', price: 156.0, change: 1.2 },
  { ticker: 'ENER', name: 'EnergyPlus', price: 67.8, change: -1.5 },
  { ticker: 'CONS', name: 'ConsumerCo', price: 98.4, change: 3.1 },
  { ticker: 'INDU', name: 'IndustrialMax', price: 112.3, change: 0.5 },
  { ticker: 'CLOU', name: 'CloudSync', price: 201.7, change: 4.2 },
  { ticker: 'AUTO', name: 'AutoDrive', price: 78.9, change: -2.1 },
  { ticker: 'MEDI', name: 'MediCare Labs', price: 134.6, change: 1.8 },
  { ticker: 'RETA', name: 'RetailGiant', price: 55.2, change: -0.3 },
]

function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  inView,
}: {
  value: number
  prefix?: string
  suffix?: string
  inView: boolean
}) {
  return (
    <motion.span
      initial={false}
      animate={{ opacity: inView ? 1 : 0 }}
      transition={{ duration: 0.5 }}
    >
      {inView ? `${prefix}${value.toLocaleString()}${suffix}` : `${prefix}0${suffix}`}
    </motion.span>
  )
}

function StatCard({
  stat,
  index,
  inView,
}: {
  stat: (typeof STATS)[number]
  index: number
  inView: boolean
}) {
  const Icon = stat.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.1, duration: 0.5 }}
      className="flex flex-col items-center gap-2 text-center"
    >
      <div
        className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5"
        style={{ color: GREEN }}
      >
        <Icon className="h-6 w-6" />
      </div>
      <p className="text-2xl font-bold text-white">
        <AnimatedCounter
          inView={inView}
          value={stat.value}
          prefix={stat.prefix ?? ''}
          suffix={stat.suffix ?? ''}
        />
      </p>
      <p className="text-sm text-zinc-400">{stat.label}</p>
    </motion.div>
  )
}

export default function LandingPage() {
  const statsRef = useRef(null)
  const statsInView = useInView(statsRef, { once: true, margin: '-80px' })
  const featuresRef = useRef(null)
  const featuresInView = useInView(featuresRef, { once: true, margin: '-80px' })
  const stepsRef = useRef(null)
  const stepsInView = useInView(stepsRef, { once: true, margin: '-80px' })
  const tickerRef = useRef(null)
  const tickerInView = useInView(tickerRef, { once: true })

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full opacity-30 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
          animate={{
            x: [0, 80, 0],
            y: [0, 40, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full opacity-25 blur-[100px]"
          style={{ background: `radial-gradient(circle, ${GREEN} 0%, transparent 70%)` }}
          animate={{
            x: [0, -60, 0],
            y: [0, 80, 0],
          }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/3 h-[350px] w-[350px] rounded-full opacity-20 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
          animate={{
            x: [0, -40, 0],
            y: [0, -60, 0],
          }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* Hero */}
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 pt-20 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5"
        >
          <span className="relative flex h-2 w-2">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ backgroundColor: GREEN }}
            />
            <span
              className="relative inline-flex h-2 w-2 rounded-full"
              style={{ backgroundColor: GREEN }}
            />
          </span>
          <span className="text-sm font-medium text-zinc-300">
            Virtual Stock Market Simulator
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="max-w-4xl text-center text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl"
        >
          <span className="block text-white">Trade </span>
          <span
            className="block bg-gradient-to-r from-[#00ff88] to-[#00cc6a] bg-clip-text text-transparent"
          >
            Smarter.
          </span>
          <span className="block text-white">Risk </span>
          <span
            className="block bg-gradient-to-r from-[#00ff88] to-[#00cc6a] bg-clip-text text-transparent"
          >
            Nothing.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-6 max-w-2xl text-center text-lg text-zinc-400 sm:text-xl"
        >
          Join thousands of traders competing on a real-time fictional stock market.
          Start with $9,000 virtual cash and build your empire.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.6 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            href="/register"
            className="rounded-xl px-8 py-4 text-base font-semibold text-[#0a0a0f] transition-all hover:opacity-90 hover:shadow-lg hover:shadow-[#00ff88]/20"
            style={{ backgroundColor: GREEN }}
          >
            Start Trading Free
          </Link>
          <Link
            href="/market"
            className="rounded-xl border-2 px-8 py-4 text-base font-semibold transition-all hover:bg-white/5"
            style={{ borderColor: GREEN, color: GREEN }}
          >
            View Market
          </Link>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-6 text-sm text-zinc-500"
        >
          No real money. No risk. Just pure strategy.
        </motion.p>
      </section>

      {/* Stats bar */}
      <section
        ref={statsRef}
        className="relative border-y border-white/[0.06] bg-white/[0.02] py-12"
      >
        <div className="mx-auto grid max-w-5xl grid-cols-2 gap-8 px-6 md:grid-cols-4">
          {STATS.map((stat, i) => (
            <StatCard key={stat.label} stat={stat} index={i} inView={statsInView} />
          ))}
        </div>
      </section>

      {/* Features */}
      <section ref={featuresRef} className="relative py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            className="text-center text-3xl font-bold text-white sm:text-4xl"
          >
            Everything a real market has.
          </motion.h2>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.1 * i, duration: 0.5 }}
                  whileHover={{
                    y: -4,
                    borderColor: 'rgba(0, 255, 136, 0.3)',
                    boxShadow: '0 0 40px rgba(0, 255, 136, 0.08)',
                  }}
                  className={`${CARD_STYLE} transition-shadow`}
                >
                  <div
                    className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5"
                    style={{ color: GREEN }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
                  <p className="mt-2 text-sm text-zinc-400">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section ref={stepsRef} className="relative py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={stepsInView ? { opacity: 1, y: 0 } : {}}
            className="text-center text-3xl font-bold text-white sm:text-4xl"
          >
            Get started in 3 steps
          </motion.h2>

          <div className="relative mt-16 flex flex-col items-stretch gap-12 md:flex-row md:items-start md:justify-between">
            {/* Dotted connector line - visible on md+ */}
            <div
              className="absolute left-1/2 top-24 hidden h-full w-0 border-l-2 border-dashed border-white/20 md:block"
              style={{ transform: 'translate(-50%, 0)', height: 'calc(100% - 6rem)' }}
            />

            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 30 }}
                  animate={stepsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.15 * i, duration: 0.5 }}
                  className="relative z-10 flex flex-1 flex-col items-center text-center md:px-4"
                >
                  <div
                    className="flex h-16 w-16 items-center justify-center rounded-2xl border-2 text-2xl font-bold"
                    style={{ borderColor: GREEN, color: GREEN }}
                  >
                    {step.num}
                  </div>
                  <div
                    className="mt-4 flex h-12 w-12 items-center justify-center rounded-xl bg-white/5"
                    style={{ color: GREEN }}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-white">{step.title}</h3>
                  <p className="mt-1 text-sm text-zinc-400">{step.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Companies ticker */}
      <section ref={tickerRef} className="relative py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={tickerInView ? { opacity: 1, y: 0 } : {}}
            className="text-center text-3xl font-bold text-white sm:text-4xl"
          >
            25+ Fictional Companies to Trade
          </motion.h2>

          <div className="mt-12 overflow-hidden">
            <motion.div
              className="flex gap-4"
              animate={{
                x: [0, -((260 + 4) * TICKER_COMPANIES.length)],
              }}
              transition={{
                duration: 35,
                repeat: Infinity,
                ease: 'linear',
              }}
            >
              {[...TICKER_COMPANIES, ...TICKER_COMPANIES].map((c, i) => (
                <div
                  key={`${c.ticker}-${i}`}
                  className="flex shrink-0 flex-col rounded-xl border border-white/10 bg-white/[0.04] px-5 py-4 backdrop-blur-sm"
                  style={{ width: 260 }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="rounded px-2 py-0.5 text-xs font-mono font-medium"
                      style={{ backgroundColor: `${GREEN}20`, color: GREEN }}
                    >
                      {c.ticker}
                    </span>
                    <span
                      className={`text-sm font-medium ${
                        c.change >= 0 ? 'text-[#00ff88]' : 'text-red-400'
                      }`}
                    >
                      {c.change >= 0 ? '+' : ''}{c.change}%
                    </span>
                  </div>
                  <p className="mt-1 truncate text-sm font-medium text-white">{c.name}</p>
                  <p className="text-lg font-bold text-white">${c.price.toFixed(2)}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-white/[0.06] bg-black/40 py-16 px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8 text-center">
          <Link href="/" className="flex items-center gap-2">
            <BarChart2 className="h-8 w-8" style={{ color: GREEN }} />
            <span className="text-xl font-semibold text-white">
              Stock<span style={{ color: GREEN }}>Sim</span>
            </span>
          </Link>
          <p className="text-sm text-zinc-500">
            Built with Next.js, Supabase, and Groq
          </p>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link href="/dashboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/market" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Market
            </Link>
            <Link href="/leaderboard" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Leaderboard
            </Link>
          </div>
          <p className="max-w-md text-xs text-zinc-500">
            Virtual platform only. Not real financial advice.
          </p>
        </div>
      </footer>
    </div>
  )
}
