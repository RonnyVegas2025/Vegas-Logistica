import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
export async function POST(req: Request) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (body.parceiro_id === '') body.parceiro_id = null
  const { data, error } = await sb.from('entregadores').insert(body).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
