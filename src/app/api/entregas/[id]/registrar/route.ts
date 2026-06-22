import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { status, data_entrega, nome_recebedor, obs_entrega, tipo_comprovante, comprovante_url, motivo_insucesso } = body
  const { data: antes } = await sb.from('entregas').select('status').eq('id', params.id).single()
  const { data, error } = await sb.from('entregas').update({
    status, data_entrega, nome_recebedor: nome_recebedor||null,
    obs_entrega: obs_entrega||null, tipo_comprovante: tipo_comprovante||null,
    comprovante_url: comprovante_url||null, motivo_insucesso: motivo_insucesso||null,
  }).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await sb.from('auditoria').insert({ usuario_id:user.id, entidade:'entregas', entidade_id:params.id, acao:`REGISTRAR_${status.toUpperCase()}`, dados_antes:antes, dados_depois:data })
  return NextResponse.json(data)
}
