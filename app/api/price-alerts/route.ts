import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const { data: alerts, error } = await supabase
      .from('price_alerts')
      .select('id, company_id, target_price, direction, is_triggered, created_at, companies(id, name, ticker)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, alerts: alerts ?? [] })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { company_id, target_price, direction } = body as {
      company_id?: string
      target_price?: number
      direction?: 'above' | 'below'
    }

    if (!company_id) return NextResponse.json({ success: false, error: 'company_id required' }, { status: 400 })
    const price = Number(target_price)
    if (!Number.isFinite(price) || price <= 0) {
      return NextResponse.json({ success: false, error: 'target_price must be a positive number' }, { status: 400 })
    }
    if (direction !== 'above' && direction !== 'below') {
      return NextResponse.json({ success: false, error: 'direction must be "above" or "below"' }, { status: 400 })
    }

    const { data: alert, error } = await supabase
      .from('price_alerts')
      .insert({
        user_id: user.id,
        company_id,
        target_price: price,
        direction,
        is_triggered: false,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, alert })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const { alert_id } = body as { alert_id?: string }
    if (!alert_id) return NextResponse.json({ success: false, error: 'alert_id required' }, { status: 400 })

    const { error } = await supabase
      .from('price_alerts')
      .delete()
      .eq('id', alert_id)
      .eq('user_id', user.id)

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
