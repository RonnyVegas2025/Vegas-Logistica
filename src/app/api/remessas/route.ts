import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const Schema = z.object({
  parceiro_id: z.string().uuid(),
  data_envio: z.string(),
  observacao: z.string().nullable().optional(),
})

export async function POST(req: Request) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const p = Schema.safeParse(body)
  if (!p.success) return NextResponse.json({ error: p.error.flatten() }, { status: 400 })
  const { data, error } = await sb.from('remessas')
    .insert({ ...p.data, criado_por: user.id, codigo: '' })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await sb.from('auditoria').insert({ usuario_id:user.id, entidade:'remessas', entidade_id:data.id, acao:'CRIAR', dados_depois:data })
  return NextResponse.json(data, { status: 201 })
}
