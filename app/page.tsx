'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'
import { useInView } from 'framer-motion'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard,
  TrendingUp,
  Users,
  Landmark,
  Rocket,
  Trophy,
  Target,
  Newspaper,
  Building2,
  DollarSign,
  Globe,
  BarChart2,
  UserPlus,
  ShoppingCart,
  Award,
  ChevronDown,
  Lock,
  Zap,
} from 'lucide-react'

const GREEN = '#00ff88'
const CARD_STYLE =
  'rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl'

const LIVE_STATS: Array<
  | { value: number; prefix?: string; suffix?: string; label: string; icon: typeof Building2 }
  | { label: string; icon: typeof Zap }
> = [
  { value: 25, suffix: '+', label: 'Companies', icon: Building2 },
  { value: 9000, prefix: '$', suffix: '', label: 'Starting Balance', icon: DollarSign },
  { label: 'Real-time Price Impact', icon: Zap },
  { value: 10, suffix: '', label: 'Sectors', icon: BarChart2 },
  { label: 'Global Leaderboard', icon: Globe },
  { label: 'Virtual Banking', icon: Landmark },
]

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Live Trading',
    description: 'Buy and sell 25+ companies with real price impact per trade.',
  },
  {
    icon: LayoutDashboard,
    title: 'Portfolio Dashboard',
    description: 'Track holdings, P&L, net worth and asset allocation in real time.',
  },
  {
    icon: Users,
    title: 'Mutual Funds',
    description: 'Create or join funds, pool capital and let a fund manager trade on your behalf.',
  },
  {
    icon: Landmark,
    title: 'Virtual Banking',
    description: 'Borrow up to 50% of your net worth. Miss repayment and lose your holdings.',
  },
  {
    icon: Rocket,
    title: 'IPO Market',
    description: 'Apply for shares before companies list. Pro-rata allocation if oversubscribed.',
  },
  {
    icon: Target,
    title: 'Limit Orders',
    description: 'Set a target price and let the system execute your trade automatically.',
  },
  {
    icon: Trophy,
    title: 'Leaderboard',
    description: 'Compete globally. Top 3 get gold silver bronze podium treatment.',
  },
  {
    icon: Newspaper,
    title: 'Market News',
    description: 'Admin-posted news affects trader sentiment and drives market movement.',
  },
]

const STEPS = [
  {
    num: 1,
    icon: UserPlus,
    title: 'Create Account',
    description: 'Register free, get $9,000 virtual cash instantly',
  },
  {
    num: 2,
    icon: BarChart2,
    title: 'Browse the Market',
    description: 'Explore 25+ companies across 10 sectors with live price charts',
  },
  {
    num: 3,
    icon: ShoppingCart,
    title: 'Trade and Invest',
    description: 'Buy stocks, join mutual funds, apply for IPOs, set limit orders',
  },
  {
    num: 4,
    icon: Trophy,
    title: 'Compete and Win',
    description: 'Climb the leaderboard, earn achievement badges, dominate the market',
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
  { ticker: 'PHAR', name: 'PharmaCore', price: 178.3, change: -0.5 },
  { ticker: 'TELC', name: 'TelcoGlobal', price: 44.1, change: 1.9 },
  { ticker: 'AGRI', name: 'AgriGrow', price: 92.0, change: -1.2 },
  { ticker: 'DEFY', name: 'DefenseTech', price: 165.4, change: 0.8 },
  { ticker: 'EDUT', name: 'EduStream', price: 38.7, change: 3.4 },
  { ticker: 'ENTR', name: 'EntertainCo', price: 71.2, change: -0.9 },
  { ticker: 'LOGY', name: 'LogiFlow', price: 88.5, change: 2.1 },
  { ticker: 'MINR', name: 'Minerals Inc', price: 125.0, change: -1.7 },
  { ticker: 'REAL', name: 'RealEstate Pro', price: 99.9, change: 0.4 },
  { ticker: 'SPRT', name: 'SportLife', price: 62.3, change: 1.5 },
  { ticker: 'TRAV', name: 'TravelWise', price: 45.6, change: -2.3 },
  { ticker: 'UTIL', name: 'UtilityPlus', price: 33.8, change: 0.2 },
  { ticker: 'WAVE', name: 'WaveTech', price: 189.1, change: 3.8 },
  { ticker: 'XPLR', name: 'ExploreLabs', price: 52.4, change: -0.6 },
  { ticker: 'ZERO', name: 'ZeroCarbon', price: 118.7, change: 2.0 },
]

const TRADING_RULES = [
  {
    title: 'Price Impact',
    description:
      'Every buy increases the stock price. Every sell decreases it. Your trades move the market.',
    borderColor: GREEN,
  },
  {
    title: '24hr Hold Rule',
    description:
      'Shares bought today cannot be sold until tomorrow. FIFO lot tracking prevents instant flipping.',
    borderColor: '#eab308',
  },
  {
    title: 'Banking Risk',
    description:
      'Loans accrue 5% weekly interest. Miss your 30-day deadline and your holdings are auto-liquidated.',
    borderColor: '#ef4444',
  },
]

const ACHIEVEMENTS = [
  { name: 'First Trade', desc: 'Complete your first buy or sell', icon: TrendingUp },
  { name: 'Diversified', desc: 'Hold positions in 5+ companies', icon: BarChart2 },
  { name: 'Whale', desc: 'Execute a single trade worth $5,000+', icon: Award },
  { name: 'Loan Shark Survivor', desc: 'Repay a loan in full before due date', icon: Landmark },
  { name: 'Fund Manager', desc: 'Create and manage a mutual fund', icon: Users },
  { name: 'Bear Survivor', desc: 'Stay profitable through a market downturn', icon: Target },
  { name: 'Top 10', desc: 'Reach the top 10 on the global leaderboard', icon: Trophy },
]

const FAQ_ITEMS = [
  {
    q: 'Is this real money?',
    a: 'No — all currency is virtual. Nothing is real.',
  },
  {
    q: 'How do stock prices change?',
    a: 'Every buy/sell by any user directly impacts the price.',
  },
  {
    q: 'Can I sell stocks I just bought?',
    a: 'No — shares have a 24-hour hold period before they can be sold.',
  },
  {
    q: "What happens if I can't repay a loan?",
    a: 'Your holdings are auto-liquidated to cover the debt.',
  },
  {
    q: 'How are IPO shares allocated?',
    a: 'Pro-rata based on how many shares each user applied for.',
  },
  {
    q: 'Can I create my own mutual fund?',
    a: 'Yes — any user can create a fund and invite others to join.',
  },
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

const TICKER_CARD_WIDTH = 260
const TICKER_GAP = 16
const TICKER_SCROLL_DISTANCE = (TICKER_CARD_WIDTH + TICKER_GAP) * TICKER_COMPANIES.length

function TickerRow({ companies, reverse }: { companies: typeof TICKER_COMPANIES; reverse?: boolean }) {
  const duplicated = [...companies, ...companies]
  return (
    <motion.div
      className="flex shrink-0 gap-4"
      animate={{
        x: reverse ? [0, TICKER_SCROLL_DISTANCE] : [0, -TICKER_SCROLL_DISTANCE],
      }}
      transition={{ duration: 45, repeat: Infinity, ease: 'linear' }}
    >
      {duplicated.map((c, i) => (
        <div
          key={`${c.ticker}-${i}`}
          className="flex shrink-0 flex-col rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-sm"
          style={{ width: TICKER_CARD_WIDTH }}
        >
          <div className="flex items-center justify-between">
            <span
              className="rounded px-2 py-0.5 text-xs font-mono font-medium"
              style={{ backgroundColor: `${GREEN}20`, color: GREEN }}
            >
              {c.ticker}
            </span>
            <span
              className={`text-sm font-medium ${c.change >= 0 ? 'text-[#00ff88]' : 'text-red-400'}`}
            >
              {c.change >= 0 ? '+' : ''}{c.change}%
            </span>
          </div>
          <p className="mt-1 truncate text-sm font-medium text-white">{c.name}</p>
          <p className="text-lg font-bold text-white">${c.price.toFixed(2)}</p>
        </div>
      ))}
    </motion.div>
  )
}

export default function LandingPage() {
  const statsRef = useRef(null)
  const statsInView = useInView(statsRef, { once: true, margin: '-80px' })
  const whatRef = useRef(null)
  const whatInView = useInView(whatRef, { once: true, margin: '-80px' })
  const featuresRef = useRef(null)
  const featuresInView = useInView(featuresRef, { once: true, margin: '-80px' })
  const stepsRef = useRef(null)
  const stepsInView = useInView(stepsRef, { once: true, margin: '-80px' })
  const marketRef = useRef(null)
  const marketInView = useInView(marketRef, { once: true })
  const rulesRef = useRef(null)
  const rulesInView = useInView(rulesRef, { once: true, margin: '-80px' })
  const achievementsRef = useRef(null)
  const achievementsInView = useInView(achievementsRef, { once: true, margin: '-80px' })
  const faqRef = useRef(null)
  const faqInView = useInView(faqRef, { once: true, margin: '-80px' })
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-x-hidden">
      {/* Animated background orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute -left-40 -top-40 h-[500px] w-[500px] rounded-full opacity-30 blur-[120px]"
          style={{ background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)' }}
          animate={{ x: [0, 80, 0], y: [0, 40, 0] }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute right-0 top-1/3 h-[400px] w-[400px] rounded-full opacity-25 blur-[100px]"
          style={{ background: `radial-gradient(circle, ${GREEN} 0%, transparent 70%)` }}
          animate={{ x: [0, -60, 0], y: [0, 80, 0] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-1/4 left-1/3 h-[350px] w-[350px] rounded-full opacity-20 blur-[100px]"
          style={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)' }}
          animate={{ x: [0, -40, 0], y: [0, -60, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut' }}
        />
      </div>

      {/* 1. HERO */}
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
            <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: GREEN }} />
          </span>
          <span className="text-sm font-medium text-zinc-300">Virtual Stock Market Simulator</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.6 }}
          className="max-w-4xl text-center text-5xl font-bold leading-tight tracking-tight sm:text-6xl md:text-7xl"
        >
          <span className="block text-white">Trade </span>
          <span className="block bg-gradient-to-r from-[#00ff88] to-[#00cc6a] bg-clip-text text-transparent">
            Smarter.
          </span>
          <span className="block text-white">Risk </span>
          <span className="block bg-gradient-to-r from-[#00ff88] to-[#00cc6a] bg-clip-text text-transparent">
            Nothing.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-6 max-w-2xl text-center text-lg text-zinc-400 sm:text-xl"
        >
          Join thousands of traders competing on a real-time fictional stock market. Start with $9,000
          virtual cash and build your empire.
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

      {/* 2. LIVE STATS BAR */}
      <section
        ref={statsRef}
        className="relative border-y border-white/[0.06] bg-white/[0.02] py-12"
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-12 gap-y-8 px-6">
          {LIVE_STATS.map((stat, i) => {
            const Icon = stat.icon
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 16 }}
                animate={statsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="flex items-center gap-3"
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/10 bg-white/5"
                  style={{ color: GREEN }}
                >
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  {'value' in stat ? (
                    <>
                      <p className="text-xl font-bold text-white">
                        <AnimatedCounter
                          inView={statsInView}
                          value={stat.value}
                          prefix={stat.prefix ?? ''}
                          suffix={stat.suffix ?? ''}
                        />
                      </p>
                      <p className="text-xs text-zinc-400">{stat.label}</p>
                    </>
                  ) : (
                    <p className="text-xl font-bold text-white">{stat.label}</p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* 3. WHAT IS STOCKSIM */}
      <section ref={whatRef} className="relative py-24 px-6">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl font-bold leading-tight text-white sm:text-4xl lg:text-5xl">
              A Stock Market That Feels Real.
            </h2>
            <div className="mt-6 space-y-4 text-zinc-400">
              <p className="text-lg leading-relaxed">
                StockSim is a full-featured virtual stock market simulation platform. Trade fictional
                companies, watch prices move based on real supply and demand, and compete on a global
                leaderboard — all without risking a single dollar.
              </p>
              <p className="text-lg leading-relaxed">
                No real money, no risk — pure strategy and competition. Every buy and sell affects
                prices. Mutual funds, IPOs, limit orders, and virtual banking mirror real market
                mechanics.
              </p>
              <p className="text-lg leading-relaxed">
                Built for people who want to understand markets without financial risk. Whether
                you&apos;re learning, testing strategies, or racing to the top, StockSim gives you
                the tools and the playground.
              </p>
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 backdrop-blur-xl"
          >
            <div className="rounded-xl border border-white/10 bg-[#111118]/80 p-5 font-mono">
              <p className="text-xs text-zinc-500 uppercase tracking-wider">Portfolio Overview</p>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-zinc-500">Net Worth</p>
                  <p className="text-2xl font-bold" style={{ color: GREEN }}>
                    $24,532.80
                  </p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Cash Balance</p>
                  <p className="text-2xl font-bold text-white">$8,120.00</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">Portfolio Value</p>
                  <p className="text-2xl font-bold text-white">$16,412.80</p>
                </div>
                <div>
                  <p className="text-xs text-zinc-500">P&L (Total)</p>
                  <p className="text-2xl font-bold" style={{ color: GREEN }}>
                    +$15,532.80
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 4. FEATURES GRID */}
      <section ref={featuresRef} className="relative py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={featuresInView ? { opacity: 1, y: 0 } : {}}
            className="text-center text-3xl font-bold text-white sm:text-4xl"
          >
            Everything a real market has. Nothing you can lose.
          </motion.h2>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((feature, i) => {
              const Icon = feature.icon
              return (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.05 * i, duration: 0.5 }}
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
                  <p className="mt-2 text-sm leading-relaxed text-zinc-400">{feature.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 5. HOW IT WORKS */}
      <section ref={stepsRef} className="relative py-24 px-6">
        <div className="mx-auto max-w-5xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={stepsInView ? { opacity: 1, y: 0 } : {}}
            className="text-center text-3xl font-bold text-white sm:text-4xl"
          >
            Get trading in 4 simple steps
          </motion.h2>

          <div className="relative mt-16 flex flex-col items-stretch gap-12 md:flex-row md:items-start md:justify-between">
            <div
              className="absolute left-1/2 top-24 hidden h-[calc(100%-6rem)] w-0 border-l-2 border-dashed md:block"
              style={{ transform: 'translateX(-50%)', borderColor: `${GREEN}40` }}
            />
            {STEPS.map((step, i) => {
              const Icon = step.icon
              return (
                <motion.div
                  key={step.num}
                  initial={{ opacity: 0, y: 30 }}
                  animate={stepsInView ? { opacity: 1, y: 0 } : {}}
                  transition={{ delay: 0.12 * i, duration: 0.5 }}
                  className="relative z-10 flex flex-1 flex-col items-center text-center md:px-4"
                >
                  <div
                    className="flex h-14 w-14 items-center justify-center rounded-2xl border-2 text-xl font-bold"
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

      {/* 6. MARKET PREVIEW */}
      <section ref={marketRef} className="relative py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={marketInView ? { opacity: 1, y: 0 } : {}}
            className="text-center text-3xl font-bold text-white sm:text-4xl"
          >
            25 Fictional Companies. Real Market Mechanics.
          </motion.h2>

          <div className="mt-12 space-y-6 overflow-hidden">
            <TickerRow companies={TICKER_COMPANIES} />
            <TickerRow companies={TICKER_COMPANIES.slice().reverse()} reverse />
          </div>
        </div>
      </section>

      {/* 7. TRADING RULES */}
      <section ref={rulesRef} className="relative py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={rulesInView ? { opacity: 1, y: 0 } : {}}
            className="text-center text-3xl font-bold text-white sm:text-4xl"
          >
            How the market works
          </motion.h2>

          <div className="mt-16 grid grid-cols-1 gap-6 md:grid-cols-3">
            {TRADING_RULES.map((rule, i) => (
              <motion.div
                key={rule.title}
                initial={{ opacity: 0, y: 24 }}
                animate={rulesInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.1 * i, duration: 0.5 }}
                className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-6 pl-6 backdrop-blur-xl"
                style={{ borderLeftWidth: 4, borderLeftColor: rule.borderColor }}
              >
                <h3 className="text-lg font-semibold text-white">{rule.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-zinc-400">{rule.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 8. ACHIEVEMENTS */}
      <section ref={achievementsRef} className="relative py-24 px-6">
        <div className="mx-auto max-w-6xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={achievementsInView ? { opacity: 1, y: 0 } : {}}
            className="text-center text-3xl font-bold text-white sm:text-4xl"
          >
            Earn badges. Prove your skill.
          </motion.h2>

          <div className="mt-16 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7">
            {ACHIEVEMENTS.map((badge, i) => {
              const Icon = badge.icon
              const unlocked = i % 2 === 0
              return (
                <motion.div
                  key={badge.name}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={achievementsInView ? { opacity: 1, scale: 1 } : {}}
                  transition={{ delay: 0.05 * i, duration: 0.4 }}
                  className={`flex flex-col items-center rounded-xl border p-4 backdrop-blur-xl ${
                    unlocked
                      ? 'border-[#00ff88]/30 bg-[#00ff88]/5'
                      : 'border-white/10 bg-white/[0.03] opacity-80'
                  }`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full border ${
                      unlocked ? 'border-[#00ff88]/30 bg-[#00ff88]/10' : 'border-white/10 bg-white/5'
                    }`}
                  >
                    {unlocked ? (
                      <Icon className="h-6 w-6" style={{ color: GREEN }} />
                    ) : (
                      <Lock className="h-6 w-6 text-zinc-500" />
                    )}
                  </div>
                  <p className="mt-2 text-center text-sm font-medium text-white">{badge.name}</p>
                  <p className="mt-0.5 text-center text-xs text-zinc-500">{badge.desc}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 9. FAQ */}
      <section ref={faqRef} className="relative py-24 px-6">
        <div className="mx-auto max-w-3xl">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={faqInView ? { opacity: 1, y: 0 } : {}}
            className="text-center text-3xl font-bold text-white sm:text-4xl"
          >
            Frequently Asked Questions
          </motion.h2>

          <div className="mt-12 space-y-3">
            {FAQ_ITEMS.map((item, i) => (
              <motion.div
                key={item.q}
                initial={{ opacity: 0, y: 12 }}
                animate={faqInView ? { opacity: 1, y: 0 } : {}}
                transition={{ delay: 0.05 * i, duration: 0.4 }}
                className="rounded-xl border border-white/[0.08] bg-white/[0.03] overflow-hidden backdrop-blur-xl"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex w-full items-center justify-between px-5 py-4 text-left"
                >
                  <span className="font-medium text-white">{item.q}</span>
                  <motion.span
                    animate={{ rotate: openFaq === i ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="h-5 w-5 text-zinc-400" />
                  </motion.span>
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <p className="border-t border-white/[0.06] px-5 py-4 text-sm text-zinc-400">
                        {item.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 10. FINAL CTA */}
      <section className="relative py-28 px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mx-auto max-w-3xl rounded-3xl border border-white/[0.08] bg-gradient-to-b from-white/[0.06] to-transparent px-8 py-16 text-center backdrop-blur-xl"
        >
          <h2 className="text-3xl font-bold text-white sm:text-4xl">
            Ready to build your empire?
          </h2>
          <p className="mt-4 text-lg text-zinc-400">
            Join now and start trading with $9,000 in virtual cash.
          </p>
          <Link
            href="/register"
            className="mt-8 inline-block rounded-xl px-10 py-4 text-lg font-semibold text-[#0a0a0f] transition-all hover:opacity-90 hover:shadow-lg hover:shadow-[#00ff88]/25"
            style={{ backgroundColor: GREEN }}
          >
            Start Trading Free
          </Link>
        </motion.div>
      </section>

      {/* 11. FOOTER */}
      <footer className="relative border-t border-white/[0.06] bg-black/40 py-16 px-6">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <BarChart2 className="h-8 w-8" style={{ color: GREEN }} />
            <span className="text-xl font-semibold text-white">
              Stock<span style={{ color: GREEN }}>Sim</span>
            </span>
          </Link>
          <div className="flex flex-wrap items-center justify-center gap-6">
            <Link
              href="/market"
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              Market
            </Link>
            <Link
              href="/leaderboard"
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              Leaderboard
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-zinc-400 transition-colors hover:text-white"
            >
              Dashboard
            </Link>
          </div>
          <div className="h-px w-full max-w-md bg-white/[0.06]" />
          <div className="flex w-full max-w-2xl flex-wrap items-center justify-between gap-4 text-sm text-zinc-500">
            <p>Virtual platform only. Not real financial advice.</p>
            <p>Designed &amp; Developed by Bhanu Chandra</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
