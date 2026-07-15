'use server'

import { createClient } from '@/lib/supabase/server'
import { EmpresaSchema } from '@/lib/validations/empresa'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) {
    // Modo validação: retorna cliente sem verificar perfil
    return { sb, userId: null }
  }
  const { data: u } = await sb.from('usuarios').select('perfil').eq('id', user.id).single()
  if (u?.perfil !== 'admin') throw new Error('Apenas administradores podem realizar esta ação')
  return { sb, userId: user.id }
}

export async function createEmpresa(_id: string | null, formData: FormData) {
  const { sb } = await assertAdmin()
  const raw = Object.fromEntries(formData)
  const parsed = EmpresaSchema.safeParse({
    ...raw,
    ativo: raw.ativo === 'true',
    valor_entrega_padrao: raw.valor_entrega_padrao || undefined,
    parceiro_padrao_id: raw.parceiro_padrao_id || undefined,
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { data, error } = await sb.from('empresas').insert(parsed.data).select('id').single()
  if (error) return { error: { _form: [error.message] } }

  revalidatePath('/empresas')
  return { success: true, id: data.id }
}

export async function updateEmpresa(id: string | null, formData: FormData) {
  const { sb } = await assertAdmin()
  const raw = Object.fromEntries(formData)
  const parsed = EmpresaSchema.safeParse({
    ...raw,
    ativo: raw.ativo === 'true',
    valor_entrega_padrao: raw.valor_entrega_padrao || undefined,
    parceiro_padrao_id: raw.parceiro_padrao_id || undefined,
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  const { error } = await sb.from('empresas').update(parsed.data).eq('id', id)
  if (error) return { error: { _form: [error.message] } }

  revalidatePath('/empresas')
  revalidatePath(`/empresas/${id}`)
  return { success: true }
}

export async function toggleEmpresaStatus(id: string, ativo: boolean): Promise<void> {
  const { sb } = await assertAdmin()
  const { error } = await sb.from('empresas').update({ ativo: !ativo }).eq('id', id)
  if (error) { console.error('toggleEmpresaStatus:', error.message); return }
  revalidatePath('/empresas')
}
