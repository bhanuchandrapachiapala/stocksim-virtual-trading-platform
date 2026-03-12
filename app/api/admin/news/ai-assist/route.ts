import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { generateNewsArticle } from '@/lib/groq'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })

    const isAdmin = (user.app_metadata?.is_admin as boolean) === true
    if (!isAdmin) return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 })

    const body = await request.json().catch(() => ({}))
    const notes = typeof body.notes === 'string' ? body.notes : ''

    const { title, body: articleBody } = await generateNewsArticle(notes)
    return NextResponse.json({ success: true, title, body: articleBody })
  } catch (e) {
    return NextResponse.json(
      { success: false, error: e instanceof Error ? e.message : 'Server error' },
      { status: 500 }
    )
  }
}
