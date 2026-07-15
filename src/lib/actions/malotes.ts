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

  if (!entregador_id || !malote_id) return

  await sb.from('delivery_assignments')
    .update({ status: 'substituida', encerrado_em: new Date().toISOString() })
    .eq('malote_id', malote_id)
    .eq('status', 'ativa')

  const { error: errAssign } = await sb.from('delivery_assignments').insert({
    malote_id,
    entregador_id,
    forma_entrega: forma,
    valor_autorizado: valor,
    autorizado_em: new Date().toISOString(),
    prazo_entrega: prazo,
    status: 'ativa',
  })

  if (errAssign) {
    console.error('Erro ao criar assignment:', errAssign.message)
    return
  }

  await sb.from('malotes').update({
    status: 'atribuido',
    valor_autorizado: valor,
  }).eq('id', malote_id)

  redirect(`/remessas/${remessa_id}`)
}
