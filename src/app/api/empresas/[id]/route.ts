import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  if (body.valor_entrega_padrao === '' || body.valor_entrega_padrao === undefined) body.valor_entrega_padrao = null
  if (body.parceiro_padrao_id === '') body.parceiro_padrao_id = null
  const { data, error } = await sb.from('empresas').update(body).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
