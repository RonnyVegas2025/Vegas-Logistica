import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'

const Schema = z.object({
  remessa_id: z.string().uuid(),
  empresa_id: z.string().uuid(),
  valor_entrega: z.number().positive(),
})

export async function POST(req: Request) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const p = Schema.safeParse(body)
  if (!p.success) return NextResponse.json({ error: p.error.flatten() }, { status: 400 })
  // Busca endereço da empresa para snapshot
  const { data: emp } = await sb.from('empresas').select('*').eq('id', p.data.empresa_id).single()
  const { data, error } = await sb.from('entregas').insert({
    remessa_id: p.data.remessa_id,
    empresa_id: p.data.empresa_id,
    valor_entrega: p.data.valor_entrega,
    endereco_logradouro: emp?.logradouro,
    endereco_numero: emp?.numero,
    endereco_complemento: emp?.complemento,
    endereco_bairro: emp?.bairro,
    endereco_cidade: emp?.cidade,
    endereco_estado: emp?.estado,
    endereco_cep: emp?.cep,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
