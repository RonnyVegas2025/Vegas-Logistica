'use server'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createTaxa(_id: string | null, formData: FormData) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: { _form: ['Não autenticado'] } }
  const cidade = formData.get('cidade') as string
  const estado = formData.get('estado') as string
  const valor_padrao = parseFloat(formData.get('valor_padrao') as string)

  if (!cidade || !estado || !valor_padrao) return { error: { _form: ['Preencha todos os campos'] } }

  const { error } = await sb.from('taxas_entrega_cidade').insert({ cidade, estado, valor_padrao })
  if (error) return { error: { _form: [error.message] } }

  revalidatePath('/taxas')
  return { success: true }
}

export async function updateTaxa(id: string | null, formData: FormData) {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) return { error: { _form: ['Não autenticado'] } }
  const cidade = formData.get('cidade') as string
  const estado = formData.get('estado') as string
  const valor_padrao = parseFloat(formData.get('valor_padrao') as string)

  const { error } = await sb.from('taxas_entrega_cidade')
    .update({ cidade, estado, valor_padrao })
    .eq('id', id!)

  if (error) return { error: { _form: [error.message] } }
  revalidatePath('/taxas')
  return { success: true }
}

export async function toggleTaxaStatus(id: string, ativo: boolean): Promise<void> {
  const sb = createClient()
  await sb.from('taxas_entrega_cidade').update({ ativo: !ativo }).eq('id', id)
  revalidatePath('/taxas')
}
