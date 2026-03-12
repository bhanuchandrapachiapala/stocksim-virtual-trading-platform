export type User = {
  id: string
  email: string
  display_name: string
  avatar_url: string | null
  cash_balance: number
  is_admin: boolean
  is_bankrupt: boolean
  created_at: string
}

export type Company = {
  id: string
  name: string
  ticker: string
  sector: string
  description: string
  current_price: number
  shares_outstanding: number
  shares_available: number
  is_ipo: boolean
  created_at: string
}

export type PriceHistory = {
  id: string
  company_id: string
  price: number
  recorded_at: string
}

export type Holding = {
  id: string
  user_id: string
  company_id: string
  quantity: number
  avg_buy_price: number
  updated_at: string
  /** Computed: quantity available to sell (e.g. not locked in open orders). */
  sellable_quantity?: number
  /** Computed: quantity locked (e.g. in open sell orders). */
  locked_quantity?: number
}

export type HoldingLot = {
  id: string
  user_id: string
  company_id: string
  quantity: number
  remaining_quantity: number
  buy_price: number
  purchased_at: string
  created_at: string
}

export type OrderSide = 'buy' | 'sell'
export type OrderType = 'market' | 'limit'
export type OrderStatus = 'pending' | 'executed' | 'cancelled'

export type Order = {
  id: string
  user_id: string
  company_id: string
  side: OrderSide
  order_type: OrderType
  quantity: number
  price: number
  status: OrderStatus
  created_at: string
  executed_at: string | null
}

export type LoanStatus = 'active' | 'repaid' | 'defaulted'

export type Loan = {
  id: string
  user_id: string
  principal: number
  interest_rate: number
  amount_owed: number
  repaid_amount: number
  due_date: string
  status: LoanStatus
  created_at: string
}

export type Fund = {
  id: string
  name: string
  description: string
  manager_id: string
  total_value: number
  fee_percent: number
  min_buy_in: number
  created_at: string
}

export type FundMember = {
  id: string
  fund_id: string
  user_id: string
  contribution: number
  joined_at: string
}

export type FundHolding = {
  id: string
  fund_id: string
  company_id: string
  quantity: number
  avg_buy_price: number
}

export type IPOStatus = 'open' | 'closed' | 'allocated'

export type IPO = {
  id: string
  company_id: string
  initial_price: number
  shares_offered: number
  shares_applied: number
  subscription_deadline: string
  status: IPOStatus
  created_at: string
}

export type IPOApplication = {
  id: string
  ipo_id: string
  user_id: string
  shares_requested: number
  shares_allocated: number
  amount_paid: number
  applied_at: string
}

export type News = {
  id: string
  title: string
  body: string
  ticker_tags: string[]
  is_pinned: boolean
  created_by: string
  created_at: string
}

export type Notification = {
  id: string
  user_id: string
  type: string
  message: string
  is_read: boolean
  created_at: string
}

export type PriceAlertDirection = 'above' | 'below'

export type PriceAlert = {
  id: string
  user_id: string
  company_id: string
  target_price: number
  direction: PriceAlertDirection
  is_triggered: boolean
  created_at: string
}

export type Achievement = {
  id: string
  user_id: string
  badge_name: string
  earned_at: string
}

export type Transaction = {
  id: string
  user_id: string
  type: string
  amount: number
  description: string
  created_at: string
}
