import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { entregador_id, valor_entrega } = await req.json()
  const update: Record<string, unknown> = {
    entregador_id, status: 'em_andamento',
    atribuido_por: user.id, atribuido_em: new Date().toISOString(),
  }
  if (valor_entrega !== undefined) update.valor_entrega = valor_entrega
  const { data, error } = await sb.from('entregas').update(update).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await sb.from('auditoria').insert({ usuario_id:user.id, entidade:'entregas', entidade_id:params.id, acao:'ATRIBUIR_ENTREGADOR', dados_depois:{entregador_id,valor_entrega} })
  return NextResponse.json(data)
}
