'use server'

import { createClient } from '@/lib/supabase/server'
import { EntregadorSchema } from '@/lib/validations/entregador'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const { data: u } = await sb.from('usuarios').select('perfil').eq('id', user.id).single()
  if (u?.perfil !== 'admin') throw new Error('Apenas administradores podem realizar esta ação')
  return { sb, userId: user.id }
}

export async function createEntregador(_id: string | null, formData: FormData) {
  const { sb } = await assertAdmin()
  const raw = Object.fromEntries(formData)
  const formas = formData.getAll('formas_habilitadas') as string[]
  const parsed = EntregadorSchema.safeParse({
    ...raw,
    ativo: raw.ativo === 'true',
    formas_habilitadas: formas,
    parceiro_id: raw.parceiro_id || undefined,
    tipo_chave_pix: raw.tipo_chave_pix || undefined,
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { error } = await sb.from('entregadores').insert(parsed.data)
  if (error) return { error: { _form: [error.message] } }

  revalidatePath('/entregadores')
  return { success: true }
}

export async function updateEntregador(id: string | null, formData: FormData) {
  const { sb } = await assertAdmin()
  const raw = Object.fromEntries(formData)
  const formas = formData.getAll('formas_habilitadas') as string[]
  const parsed = EntregadorSchema.safeParse({
    ...raw,
    ativo: raw.ativo === 'true',
    formas_habilitadas: formas,
    parceiro_id: raw.parceiro_id || undefined,
    tipo_chave_pix: raw.tipo_chave_pix || undefined,
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { error } = await sb.from('entregadores').update(parsed.data).eq('id', id)
  if (error) return { error: { _form: [error.message] } }

  revalidatePath('/entregadores')
  return { success: true }
}

export async function toggleEntregadorStatus(id: string, ativo: boolean): Promise<void> {
  const { sb } = await assertAdmin()
  const { error } = await sb.from('entregadores').update({ ativo: !ativo }).eq('id', id)
  if (error) { console.error('toggleEntregadorStatus:', error.message); return }
  revalidatePath('/entregadores')
}
