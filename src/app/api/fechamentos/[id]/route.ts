import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { acao } = await req.json()
  const update = acao === 'aprovar'
    ? { status: 'aprovado', aprovado_por: user.id, aprovado_em: new Date().toISOString() }
    : { status: 'pago', pago_em: new Date().toISOString() }
  const { data, error } = await sb.from('fechamentos').update(update).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await sb.from('auditoria').insert({ usuario_id:user.id, entidade:'fechamentos', entidade_id:params.id, acao:acao.toUpperCase(), dados_depois:data })
  return NextResponse.json(data)
}
