'use server'

import { createClient } from '@/lib/supabase/server'
import { FilialSchema } from '@/lib/validations/filial'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const { data: u } = await sb.from('usuarios').select('perfil').eq('id', user.id).single()
  if (u?.perfil !== 'admin') throw new Error('Apenas administradores podem realizar esta ação')
  return { sb, userId: user.id }
}

export async function createFilial(_id: string | null, formData: FormData) {
  const { sb } = await assertAdmin()
  const raw = Object.fromEntries(formData)
  const parsed = FilialSchema.safeParse({ ...raw, ativo: raw.ativo === 'true' })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  // Verifica unicidade do code
  const { data: existing } = await sb
    .from('filiais').select('id').eq('code', parsed.data.code).maybeSingle()
  if (existing) return { error: { code: ['Código já cadastrado'] } }

  const { error } = await sb.from('filiais').insert(parsed.data)
  if (error) return { error: { _form: [error.message] } }

  revalidatePath('/filiais')
  return { success: true }
}

export async function updateFilial(id: string | null, formData: FormData) {
  const { sb } = await assertAdmin()
  const raw = Object.fromEntries(formData)
  const parsed = FilialSchema.safeParse({ ...raw, ativo: raw.ativo === 'true' })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  // Verifica unicidade do code (excluindo o próprio registro)
  const { data: existing } = await sb
    .from('filiais').select('id').eq('code', parsed.data.code).neq('id', id).maybeSingle()
  if (existing) return { error: { code: ['Código já cadastrado'] } }

  const { error } = await sb.from('filiais').update(parsed.data).eq('id', id)
  if (error) return { error: { _form: [error.message] } }

  revalidatePath('/filiais')
  return { success: true }
}

export async function toggleFilialStatus(id: string, ativo: boolean): Promise<void> {
  const { sb } = await assertAdmin()
  const { error } = await sb.from('filiais').update({ ativo: !ativo }).eq('id', id)
  if (error) { console.error('toggleFilialStatus:', error.message); return }
  revalidatePath('/filiais')
}
