import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { status } = await req.json()
  const extra: Record<string, string> = {}
  if (status === 'recebida') extra.data_recebimento = new Date().toISOString().split('T')[0]
  const { data, error } = await sb.from('remessas').update({ status, ...extra }).eq('id', params.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await sb.from('auditoria').insert({ usuario_id:user.id, entidade:'remessas', entidade_id:params.id, acao:`STATUS_${status.toUpperCase()}` })
  return NextResponse.json(data)
}
