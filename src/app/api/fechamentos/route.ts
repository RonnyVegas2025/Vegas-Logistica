import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
export async function POST(req: Request) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { data, error } = await sb.from('fechamentos').insert({ ...body, criado_por: user.id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await sb.from('auditoria').insert({ usuario_id:user.id, entidade:'fechamentos', entidade_id:data.id, acao:'CRIAR', dados_depois:data })
  return NextResponse.json(data, { status: 201 })
}
