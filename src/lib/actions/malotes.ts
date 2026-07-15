'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function atribuirEntregador(formData: FormData) {
  const sb = createClient()

  const malote_id = formData.get('malote_id') as string
  const remessa_id = formData.get('remessa_id') as string
  const entregador_id = formData.get('entregador_id') as string
  const valor = parseFloat(formData.get('valor_autorizado') as string || '0')
  const forma = formData.get('forma_entrega') as string
  const prazo = formData.get('prazo_entrega') as string || null

  console.log('ATRIBUIR:', { malote_id, remessa_id, entregador_id, valor, forma })

  if (!entregador_id || !malote_id) {
    console.error('ERRO: malote_id ou entregador_id ausente')
    return
  }

  // Encerra assignment ativa anterior
  const { error: errUpdate } = await sb
    .from('delivery_assignments')
    .update({
      status: 'substituida',
      encerrado_em: new Date().toISOString(),
      motivo_encerramento: 'Substituída por nova atribuição'
    })
    .eq('malote_id', malote_id)
    .eq('status', 'ativa')

  if (errUpdate) console.error('Erro ao encerrar assignment anterior:', errUpdate.message)

  // Insere nova assignment
  const { data: newAssign, error: errAssign } = await sb
    .from('delivery_assignments')
    .insert({
      malote_id,
      entregador_id,
      forma_entrega: forma,
      valor_autorizado: valor,
      autorizado_em: new Date().toISOString(),
      prazo_entrega: prazo || null,
      status: 'ativa',
      criado_por: null,
    })
    .select()
    .single()

  if (errAssign) {
    console.error('ERRO ao inserir assignment:', errAssign.message, errAssign.details, errAssign.hint)
    return
  }

  console.log('Assignment criada:', newAssign?.id)

  // Atualiza malote
  const { error: errMalote } = await sb
    .from('malotes')
    .update({
      status: 'atribuido',
      valor_autorizado: valor,
    })
    .eq('id', malote_id)

  if (errMalote) console.error('Erro ao atualizar malote:', errMalote.message)

  redirect(`/remessas/${remessa_id}`)
}
