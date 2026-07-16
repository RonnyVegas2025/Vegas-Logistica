import { createClient } from '@/lib/supabase/server'
import FechamentoClient from '@/components/modules/FechamentoClient'

export const dynamic = 'force-dynamic'

export default async function FechamentoPage() {
  const sb = createClient()

  // Malotes elegíveis (entregues)
  const { data: elegiveis } = await sb
    .from('malotes')
    .select(`
      id, codigo_op, valor_autorizado, status,
      end_cidade, end_estado,
      empresas(razao_social, cnpj),
      remessas(id, codigo_op, codigo, data_envio, parceiros(id, nome)),
      delivery_assignments(
        id, status, valor_autorizado,
        entregadores(id, nome),
        entregador_id
      )
    `)
    .eq('status', 'entregue')
    .order('codigo_op')

  // Fechamentos existentes
  const { data: fechamentos } = await sb
    .from('fechamentos')
    .select(`
      id, tipo_pagamento, quantidade_entregas,
      valor_total, valor_acordado, status,
      aprovado_em, pago_em, observacoes, criado_em,
      parceiros(nome),
      entregadores(nome),
      remessas(codigo_op, codigo)
    `)
    .order('criado_em', { ascending: false })

  const { data: parceiros } = await sb
    .from('parceiros')
    .select('id, nome')
    .eq('ativo', true)

  const { data: entregadores } = await sb
    .from('entregadores')
    .select('id, nome')
    .eq('ativo', true)
    .order('nome')

  return (
    <FechamentoClient
      elegiveis={elegiveis ?? []}
      fechamentos={fechamentos ?? []}
      parceiros={parceiros ?? []}
      entregadores={entregadores ?? []}
    />
  )
}
