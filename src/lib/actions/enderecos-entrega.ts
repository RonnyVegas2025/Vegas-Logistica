'use server'

import { createClient } from '@/lib/supabase/server'
import { EnderecoEntregaSchema } from '@/lib/validations/endereco-entrega'
import { revalidatePath } from 'next/cache'

async function assertAdmin() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  if (!user) throw new Error('Não autenticado')
  const { data: u } = await sb.from('usuarios').select('perfil').eq('id', user.id).single()
  if (u?.perfil !== 'admin') throw new Error('Apenas administradores podem realizar esta ação')
  return { sb, userId: user.id }
}

export async function createEnderecoEntrega(_id: string | null, empresaId: string, formData: FormData) {
  const { sb } = await assertAdmin()
  const raw = Object.fromEntries(formData)
  const parsed = EnderecoEntregaSchema.safeParse({
    ...raw,
    principal: raw.principal === 'true',
    ativo: raw.ativo === 'true',
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  // Se vai ser principal, remove principal dos demais
  if (parsed.data.principal) {
    await sb
      .from('company_delivery_addresses')
      .update({ principal: false })
      .eq('empresa_id', empresaId)
      .eq('principal', true)
  }

  const { error } = await sb
    .from('company_delivery_addresses')
    .insert({ ...parsed.data, empresa_id: empresaId })
  if (error) return { error: { _form: [error.message] } }

  revalidatePath(`/empresas/${empresaId}`)
  return { success: true }
}

export async function updateEnderecoEntrega(
  id: string | null,
  empresaId: string,
  formData: FormData
) {
  const { sb } = await assertAdmin()
  const raw = Object.fromEntries(formData)
  const parsed = EnderecoEntregaSchema.safeParse({
    ...raw,
    principal: raw.principal === 'true',
    ativo: raw.ativo === 'true',
  })
  if (!parsed.success) return { error: parsed.error.flatten().fieldErrors }

  // Se vai ser principal, remove principal dos demais (exceto este)
  if (parsed.data.principal) {
    await sb
      .from('company_delivery_addresses')
      .update({ principal: false })
      .eq('empresa_id', empresaId)
      .eq('principal', true)
      .neq('id', id)
  }

  const { error } = await sb
    .from('company_delivery_addresses')
    .update(parsed.data)
    .eq('id', id)
  if (error) return { error: { _form: [error.message] } }

  revalidatePath(`/empresas/${empresaId}`)
  return { success: true }
}

export async function setPrincipal(id: string, empresaId: string): Promise<void> {
  const { sb } = await assertAdmin()
  // Remove principal de todos da empresa
  await sb
    .from('company_delivery_addresses')
    .update({ principal: false })
    .eq('empresa_id', empresaId)
  // Define este como principal
  const { error } = await sb
    .from('company_delivery_addresses')
    .update({ principal: true })
    .eq('id', id)
  if (error) { console.error('setPrincipal:', error.message); return }
  revalidatePath(`/empresas/${empresaId}`)
}

export async function copiarEnderecoCadastral(empresaId: string): Promise<void> {
  const { sb } = await assertAdmin()
  // Busca dados cadastrais da empresa
  const { data: empresa } = await sb
    .from('empresas')
    .select('logradouro,numero,complemento,bairro,cidade,estado,cep')
    .eq('id', empresaId)
    .single()

  if (!empresa?.logradouro || !empresa?.cidade || !empresa?.estado) {
    console.error('copiarEnderecoCadastral: empresa sem endereço cadastral completo')
    return
  }

  const { error } = await sb.from('company_delivery_addresses').insert({
    empresa_id: empresaId,
    nome_identificador: 'Cópia do Endereço Cadastral',
    origem: 'cadastral',
    logradouro: empresa.logradouro,
    numero: empresa.numero,
    complemento: empresa.complemento,
    bairro: empresa.bairro,
    cidade: empresa.cidade,
    estado: empresa.estado,
    cep: empresa.cep,
    principal: false,
    ativo: true,
  })
  if (error) { console.error('copiarEnderecoCadastral:', error.message); return }

  revalidatePath(`/empresas/${empresaId}`)
}

export async function toggleEnderecoStatus(id: string, empresaId: string, ativo: boolean): Promise<void> {
  const { sb } = await assertAdmin()
  const { error } = await sb
    .from('company_delivery_addresses')
    .update({ ativo: !ativo, ...(ativo ? { principal: false } : {}) })
    .eq('id', id)
  if (error) { console.error('toggleEnderecoStatus:', error.message); return }
  revalidatePath(`/empresas/${empresaId}`)
}
