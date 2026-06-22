import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const { remessa_id, entregas } = await req.json()
  if (!remessa_id || !Array.isArray(entregas)) return NextResponse.json({ error: 'Dados inválidos' }, { status: 400 })

  const rows = entregas.map((e: any) => ({
    remessa_id,
    empresa_id: e.empresa_id || null,
    valor_entrega: e.valor_entrega || 0,
    endereco_logradouro: e.logradouro || null,
    endereco_numero: e.numero || null,
    endereco_complemento: e.complemento || null,
    endereco_bairro: e.bairro || null,
    endereco_cidade: e.cidade || null,
    endereco_estado: e.estado || null,
    endereco_cep: e.cep || null,
  })).filter((r: any) => r.empresa_id) // só importa as vinculadas

  if (!rows.length) return NextResponse.json({ error: 'Nenhuma entrega válida para importar' }, { status: 400 })

  const { data, error } = await sb.from('entregas').insert(rows).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await sb.from('auditoria').insert({ usuario_id:user.id, entidade:'entregas', acao:'IMPORTAR_PLANILHA', dados_depois:{ remessa_id, count:data.length } })
  return NextResponse.json({ count: data.length })
}
