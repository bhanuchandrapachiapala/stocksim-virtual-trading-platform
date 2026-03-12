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
    const { title, body: articleBody, ticker_tags, is_pinned } = body as {
      title?: string
      body?: string
      ticker_tags?: string[]
      is_pinned?: boolean
    }

    if (!title || typeof title !== 'string' || title.trim().length === 0) {
      return NextResponse.json({ success: false, error: 'Title is required' }, { status: 400 })
    }

    const tags = Array.isArray(ticker_tags) ? ticker_tags : []
    const pinned = Boolean(is_pinned)

    const { data: news, error } = await supabase
      .from('news')
      .insert({
        title: title.trim(),
        body: typeof articleBody === 'string' ? articleBody.trim() : '',
        ticker_tags: tags,
        is_pinned: pinned,
        created_by: user.id,
      })
      .select()
      .single()

    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, news })
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

    const isAdmin = (user.app_metadata?.is_admin as boolean) === true
    if (!isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const { news_id } = body as { news_id?: string }
    if (!news_id) return NextResponse.json({ success: false, error: 'news_id required' }, { status: 400 })

    const { error } = await supabase.from('news').delete().eq('id', news_id)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const isAdmin = (user.app_metadata?.is_admin as boolean) === true
    if (!isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const body = await request.json()
    const { news_id, is_pinned } = body as { news_id?: string; is_pinned?: boolean }
    if (!news_id) return NextResponse.json({ success: false, error: 'news_id required' }, { status: 400 })

    const { error } = await supabase.from('news').update({ is_pinned: Boolean(is_pinned) }).eq('id', news_id)
    if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
