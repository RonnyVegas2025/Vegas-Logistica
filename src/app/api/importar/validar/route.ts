import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { cnpjs } = await request.json()
  const sb = createClient()

  const { data: empresas } = await sb
    .from('empresas')
    .select('id, razao_social, cnpj, cidade, estado, cep, logradouro, numero, bairro, valor_entrega_padrao')
    .in('cnpj', cnpjs)

  const { data: taxas } = await sb
    .from('taxas_entrega_cidade')
    .select('cidade, estado, valor_padrao')
    .eq('ativo', true)

  return NextResponse.json({ empresas: empresas ?? [], taxas: taxas ?? [] })
}
