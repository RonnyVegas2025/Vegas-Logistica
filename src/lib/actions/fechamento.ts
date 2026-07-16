'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function criarFechamentoPorRemessa(formData: FormData) {
  const sb = createClient()
  const remessa_id = formData.get('remessa_id') as string
  const tipo_pagamento = formData.get('tipo_pagamento') as string
  const parceiro_id = formData.get('parceiro_id') as string || null
  const entregador_id = formData.get('entregador_id') as string || null
  const previsao_pagamento = formData.get('previsao_pagamento') as string || null
  const observacoes = formData.get('observacoes') as string || null

  if (!remessa_id) return { error: 'Remessa obrigatória' }

  // Busca malotes entregues da remessa não em fechamento aberto
  const query = sb
    .from('malotes')
    .select(`
      id, valor_autorizado,
      delivery_assignments(id, status, entregador_id, valor_autorizado)
    `)
    .eq('remessa_id', remessa_id)
    .eq('status', 'entregue')

  // Se pagar entregador específico, filtra por ele
  const { data: malotes } = await query

  if (!malotes?.length) return { error: 'Nenhum malote entregue nesta remessa' }

  // Filtra por entregador se necessário
  let malotesFiltrados = malotes
  if (tipo_pagamento === 'entregador' && entregador_id) {
    malotesFiltrados = malotes.filter(m => {
      const assignments = (m.delivery_assignments as any[]) ?? []
      const enc = assignments.find(a => a.status === 'encerrada')
      return enc?.entregador_id === entregador_id
    })
  }

  if (!malotesFiltrados.length) return { error: 'Nenhum malote encontrado para este entregador' }

  const valor_total = malotesFiltrados.reduce((acc, m) => acc + (m.valor_autorizado ?? 0), 0)

  // Cria fechamento
  const { data: fechamento, error: errFech } = await sb
    .from('fechamentos')
    .insert({
      remessa_id,
      tipo_pagamento,
      parceiro_id: tipo_pagamento === 'nex7' ? parceiro_id : null,
      entregador_id: tipo_pagamento === 'entregador' ? entregador_id : null,
      quantidade_entregas: malotesFiltrados.length,
      valor_total,
      valor_acordado: valor_total,
      status: 'pendente',
      observacoes,
      criado_por: null,
    })
    .select('id')
    .single()

  if (errFech) return { error: errFech.message }

  // Vincula malotes ao fechamento
  await sb.from('fechamento_malotes').insert(
    malotesFiltrados.map(m => {
      const assignments = (m.delivery_assignments as any[]) ?? []
      const enc = assignments.find(a => a.status === 'encerrada') ?? assignments[0]
      return {
        fechamento_id: fechamento.id,
        malote_id: m.id,
        assignment_id: enc?.id ?? null,
        valor_autorizado: m.valor_autorizado,
        valor_pago: m.valor_autorizado,
      }
    })
  )

  const forma_pagamento = formData.get('forma_pagamento') as string || null

  // Monta observações completas
  const obsCompleta = [
    observacoes,
    previsao_pagamento ? `Previsão: ${previsao_pagamento}` : null,
    forma_pagamento ? `Forma: ${forma_pagamento}` : null,
  ].filter(Boolean).join('\n')

  if (obsCompleta) {
    await sb.from('fechamentos')
      .update({ observacoes: obsCompleta })
      .eq('id', fechamento.id)
  }

  revalidatePath('/fechamento')
  return { success: true, fechamento_id: fechamento.id }
}

export async function aprovarFechamento(fechamento_id: string) {
  const sb = createClient()
  const { error } = await sb
    .from('fechamentos')
    .update({ status: 'aprovado', aprovado_em: new Date().toISOString() })
    .eq('id', fechamento_id)
  if (error) return { error: error.message }
  revalidatePath('/fechamento')
  return { success: true }
}

export async function marcarPago(formData: FormData) {
  const sb = createClient()
  const fechamento_id = formData.get('fechamento_id') as string
  const comprovante_url = formData.get('comprovante_url') as string || null

  const { error } = await sb
    .from('fechamentos')
    .update({
      status: 'pago',
      pago_em: new Date().toISOString(),
      comprovante_pag_url: comprovante_url,
    })
    .eq('id', fechamento_id)

  if (error) return { error: error.message }
  revalidatePath('/fechamento')
  return { success: true }
}

export async function criarFechamentoSelecionado(formData: FormData) {
  const sb = createClient()

  const malote_ids: string[] = JSON.parse(formData.get('malote_ids') as string ?? '[]')
  const tipo_pagamento = formData.get('tipo_pagamento') as string
  const parceiro_id = formData.get('parceiro_id') as string || null
  const entregador_id = formData.get('entregador_id') as string || null
  const previsao_pagamento = formData.get('previsao_pagamento') as string || null
  const forma_pagamento = formData.get('forma_pagamento') as string || null
  const observacoes = formData.get('observacoes') as string || null

  if (!malote_ids.length) return { error: 'Selecione ao menos um malote' }

  const { data: malotes } = await sb
    .from('malotes')
    .select('id, valor_autorizado, delivery_assignments(id, status)')
    .in('id', malote_ids)

  if (!malotes?.length) return { error: 'Malotes não encontrados' }

  const valor_total = malotes.reduce((acc, m) => acc + (m.valor_autorizado ?? 0), 0)

  const obsCompleta = [
    observacoes,
    previsao_pagamento ? `Previsão: ${previsao_pagamento}` : null,
    forma_pagamento ? `Forma: ${forma_pagamento}` : null,
  ].filter(Boolean).join('\n')

  const { data: fechamento, error: errFech } = await sb
    .from('fechamentos')
    .insert({
      tipo_pagamento,
      parceiro_id: tipo_pagamento === 'nex7' ? parceiro_id : null,
      entregador_id: tipo_pagamento === 'entregador' ? entregador_id : null,
      quantidade_entregas: malotes.length,
      valor_total,
      valor_acordado: valor_total,
      status: 'pendente',
      observacoes: obsCompleta || null,
    })
    .select('id')
    .single()

  if (errFech) {
    console.error('ERRO INSERT FECHAMENTO:', JSON.stringify(errFech, null, 2))
    return { error: errFech.message }
  }

  await sb.from('fechamento_malotes').insert(
    malotes.map(m => {
      const assignments = (m.delivery_assignments as any[]) ?? []
      const enc = assignments.find(a => a.status === 'encerrada') ?? assignments[0]
      return {
        fechamento_id: fechamento.id,
        malote_id: m.id,
        assignment_id: enc?.id ?? null,
        valor_autorizado: m.valor_autorizado,
        valor_pago: m.valor_autorizado,
      }
    })
  )

  revalidatePath('/fechamento')
  return { success: true, fechamento_id: fechamento.id }
}
