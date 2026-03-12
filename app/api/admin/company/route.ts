import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const isAdmin = (user.app_metadata?.is_admin as boolean) === true
    if (!isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const {
      name,
      ticker,
      sector,
      description,
      current_price,
      shares_outstanding,
    } = body as {
      name?: string
      ticker?: string
      sector?: string
      description?: string
      current_price?: number
      shares_outstanding?: number
    }

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Name is required' }, { status: 400 })
    }
    if (!ticker || typeof ticker !== 'string' || ticker.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Ticker is required' }, { status: 400 })
    }

    const price = Number(current_price)
    const shares = Number(shares_outstanding)
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(shares) || shares <= 0) {
      return NextResponse.json(
        { success: false, error: 'Valid current_price and shares_outstanding required' },
        { status: 400 }
      )
    }

    const tickerUpper = ticker.trim().toUpperCase()
    const sharesAvailable = Math.floor(shares)

    const { data: company, error: insertError } = await supabase
      .from('companies')
      .insert({
        name: name.trim(),
        ticker: tickerUpper,
        sector: typeof sector === 'string' ? sector.trim() : 'Other',
        description: typeof description === 'string' ? description.trim() : '',
        current_price: price,
        shares_outstanding: sharesAvailable,
        shares_available: sharesAvailable,
        is_ipo: false,
      })
      .select()
      .single()

    if (insertError) {
      return NextResponse.json({ success: false, error: insertError.message }, { status: 500 })
    }

    await supabase.from('price_history').insert({
      company_id: company.id,
      price: price,
      recorded_at: new Date().toISOString(),
    })

    return NextResponse.json({ success: true, company })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
