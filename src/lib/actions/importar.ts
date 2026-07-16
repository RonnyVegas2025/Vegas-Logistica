'use server'

import { createClient } from '@/lib/supabase/server'

export async function importarRemessa(formData: FormData) {
  const sb = createClient()

  const data_remessa = formData.get('data_remessa') as string
  const nome_arquivo = formData.get('nome_arquivo') as string
  const grupos: any[] = JSON.parse(formData.get('grupos') as string)

  if (!data_remessa) return { error: 'Data da remessa obrigatória' }

  // Gera código da remessa
  const { data: ultimaRemessa } = await sb
    .from('remessas')
    .select('codigo_op')
    .order('criado_em', { ascending: false })
    .limit(1)
    .single()

  const proximoNum = ultimaRemessa?.codigo_op
    ? parseInt(ultimaRemessa.codigo_op.split('-')[2] || '0') + 1
    : 1

  const ano = new Date(data_remessa).getFullYear()
  const codigo_op = `REM-${ano}-${String(proximoNum).padStart(5, '0')}`

  // Busca parceiro NEX7
  const { data: parceiro } = await sb
    .from('parceiros')
    .select('id')
    .limit(1)
    .single()

  // Cria remessa
  const { data: remessa, error: errRemessa } = await sb
    .from('remessas')
    .insert({
      parceiro_id: parceiro?.id,
      data_envio: data_remessa,
      status: 'enviada',
      observacao: `Importação: ${nome_arquivo}`,
      codigo: codigo_op,
      codigo_op,
    })
    .select('id, codigo_op')
    .single()

  if (errRemessa) return { error: errRemessa.message }

  // Processa cada grupo (malote)
  for (const grupo of grupos) {
    let empresa_id = grupo.empresa_id

    // Cria empresa se não existir
    if (!empresa_id) {
      const { data: novaEmpresa } = await sb
        .from('empresas')
        .insert({
          razao_social: grupo.razao_social || grupo.empresa_nome,
          cnpj: grupo.cnpj,
          cidade: grupo.cidade,
          estado: grupo.estado,
          cep: grupo.cep,
          logradouro: grupo.logradouro,
          numero: grupo.numero,
          bairro: grupo.bairro,
          valor_entrega_padrao: grupo.valor_entrega || 0,
          ativo: true,
        })
        .select('id')
        .single()

      empresa_id = novaEmpresa?.id
    }

    if (!empresa_id) continue

    // Gera código do malote
    const { data: seqData } = await sb.rpc('nextval', { seq: 'malote_op_seq' }).single()
    const malote_codigo = `MAL-${ano}-${String((seqData as any) || 1).padStart(5, '0')}`

    // Cria malote
    const { data: malote } = await sb
      .from('malotes')
      .insert({
        remessa_id: remessa.id,
        empresa_id,
        end_cidade: grupo.cidade,
        end_estado: grupo.estado,
        end_logradouro: grupo.logradouro,
        end_numero: grupo.numero,
        end_bairro: grupo.bairro,
        end_cep: grupo.cep,
        valor_autorizado: grupo.valor_entrega || 0,
        status: 'aguardando_atribuicao',
        codigo_op: malote_codigo,
      })
      .select('id')
      .single()

    if (!malote) continue

    // Cria itens
    const itens = grupo.itens.map((item: any) => ({
      malote_id: malote.id,
      descricao: 'Cartão',
      numero_serie: item.id_produto,
      quantidade: 1,
    }))

    await sb.from('malote_itens').insert(itens)
  }

  return { success: true, codigo_op: remessa.codigo_op }
}
