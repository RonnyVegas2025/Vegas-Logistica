import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

const STATUS_LABEL: Record<string, string> = {
  aguardando_atribuicao: 'Aguardando',
  atribuido: 'Atribuído',
  em_transito: 'Em trânsito',
  entregue: 'Entregue',
  insucesso: 'Insucesso',
  reentrega_pendente: 'Reentrega',
  cancelado: 'Cancelado',
}

const STATUS_BADGE: Record<string, string> = {
  aguardando_atribuicao: 'bg-gray-100 text-gray-600',
  atribuido: 'bg-blue-100 text-blue-700',
  em_transito: 'bg-amber-100 text-amber-700',
  entregue: 'bg-green-100 text-green-700',
  insucesso: 'bg-red-100 text-red-700',
  reentrega_pendente: 'bg-orange-100 text-orange-700',
  cancelado: 'bg-gray-100 text-gray-400',
}

export default async function EntregasPage({
  searchParams,
}: {
  searchParams: { status?: string; q?: string; entregador?: string }
}) {
  const sb = createClient()
  const { status, q, entregador } = searchParams

  let query = sb
    .from('malotes')
    .select(`
      id, codigo_op, status, valor_autorizado,
      end_cidade, end_estado,
      remessas(id, codigo_op, codigo),
      empresas(razao_social, cnpj),
      malote_itens(numero_serie),
      delivery_assignments(
        id, status, forma_entrega, valor_autorizado,
        entregadores(id, nome)
      )
    `)
    .order('codigo_op')

  if (status && status !== 'todos') {
    query = query.eq('status', status)
  }

  const { data: malotesRaw } = await query
  const { data: entregadores } = await sb
    .from('entregadores')
    .select('id, nome')
    .eq('ativo', true)
    .order('nome')

  // Filtra no cliente por q e entregador
  let malotes = malotesRaw ?? []

  if (q) {
    const ql = q.toLowerCase()
    malotes = malotes.filter(m => {
      const empresa = m.empresas as any
      const itens = (m.malote_itens as any[]) ?? []
      return (
        empresa?.razao_social?.toLowerCase().includes(ql) ||
        empresa?.cnpj?.includes(ql) ||
        m.codigo_op?.toLowerCase().includes(ql) ||
        itens.some((i: any) => i.numero_serie?.toLowerCase().includes(ql))
      )
    })
  }

  if (entregador) {
    malotes = malotes.filter(m => {
      const assignments = (m.delivery_assignments as any[]) ?? []
      const active = assignments.find(a => a.status === 'ativa')
      return active?.entregadores?.id === entregador
    })
  }

  const total = malotes.length
  const contadores = {
    todos: malotesRaw?.length ?? 0,
    aguardando_atribuicao: malotesRaw?.filter(m => m.status === 'aguardando_atribuicao').length ?? 0,
    atribuido: malotesRaw?.filter(m => m.status === 'atribuido').length ?? 0,
    entregue: malotesRaw?.filter(m => m.status === 'entregue').length ?? 0,
    insucesso: malotesRaw?.filter(m => m.status === 'insucesso').length ?? 0,
  }

  const filtrosStatus = [
    { label: 'Todos', value: 'todos', count: contadores.todos },
    { label: 'Pendentes', value: 'aguardando_atribuicao', count: contadores.aguardando_atribuicao },
    { label: 'Atribuídos', value: 'atribuido', count: contadores.atribuido },
    { label: 'Entregues', value: 'entregue', count: contadores.entregue },
    { label: 'Insucessos', value: 'insucesso', count: contadores.insucesso },
  ]

  return (
    <div className="fade-in">
      <div className="page-h">
        <div>
          <h1 className="page-title">Entregas</h1>
          <p className="page-sub">Todos os malotes · {total} resultado(s)</p>
        </div>
      </div>

      {/* Filtros de busca */}
      <form method="GET" className="flex gap-2 mb-3 flex-wrap">
        <input
          name="q"
          className="form-input max-w-xs"
          placeholder="Empresa, CNPJ, código ou ID produto..."
          defaultValue={q ?? ''}
        />
        <select name="entregador" className="form-input w-44" defaultValue={entregador ?? ''}>
          <option value="">Todos entregadores</option>
          {(entregadores ?? []).map(e => (
            <option key={e.id} value={e.id}>{e.nome}</option>
          ))}
        </select>
        <input type="hidden" name="status" value={status ?? 'todos'} />
        <button type="submit" className="btn btn-primary">Buscar</button>
        <a href="/entregas" className="btn">Limpar</a>
      </form>

      {/* Chips de status */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {filtrosStatus.map(f => (
          <Link
            key={f.value}
            href={`/entregas?status=${f.value}${q ? `&q=${q}` : ''}${entregador ? `&entregador=${entregador}` : ''}`}
            className={`btn btn-sm ${(!status && f.value === 'todos') || status === f.value ? 'btn-primary' : ''}`}
          >
            {f.label}
            <span className="ml-1.5 text-xs opacity-70">{f.count}</span>
          </Link>
        ))}
      </div>

      <div className="card">
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead>
              <tr>
                <th>Código</th>
                <th>Empresa / CNPJ</th>
                <th>Produtos</th>
                <th>Remessa</th>
                <th>Cidade / UF</th>
                <th>Entregador</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {malotes.map(m => {
                const remessa = m.remessas as any
                const empresa = m.empresas as any
                const itens = (m.malote_itens as any[]) ?? []
                const assignments = (m.delivery_assignments as any[]) ?? []
                const activeAssignment = assignments.find(a => a.status === 'ativa')
                  ?? assignments.find(a => a.status === 'encerrada')
                  ?? assignments[0]
                const entregadorNome = activeAssignment?.entregadores?.nome

                return (
                  <tr key={m.id}>
                    <td className="mono text-xs font-semibold">{m.codigo_op}</td>
                    <td>
                      <div className="font-medium text-sm">{empresa?.razao_social ?? '—'}</div>
                      <div className="mono text-xs text-gray-400">{empresa?.cnpj}</div>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-1">
                        {itens.slice(0,3).map((i: any) => (
                          <span key={i.numero_serie} className="badge bg-blue-50 text-blue-700 text-xs font-mono">
                            {i.numero_serie}
                          </span>
                        ))}
                        {itens.length > 3 && (
                          <span className="badge bg-gray-100 text-gray-500 text-xs">+{itens.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <Link href={`/remessas/${remessa?.id}`} className="mono text-xs text-blue-600 hover:underline">
                        {remessa?.codigo_op ?? remessa?.codigo ?? '—'}
                      </Link>
                    </td>
                    <td className="muted text-sm">
                      {[m.end_cidade, m.end_estado].filter(Boolean).join(' / ') || '—'}
                    </td>
                    <td className="text-sm">{entregadorNome ?? <span className="text-gray-300">—</span>}</td>
                    <td className="text-sm font-medium">
                      {m.valor_autorizado > 0
                        ? new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(m.valor_autorizado)
                        : <span className="text-gray-400 text-xs">A definir</span>
                      }
                    </td>
                    <td>
                      <span className={`badge text-xs ${STATUS_BADGE[m.status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {STATUS_LABEL[m.status] ?? m.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {m.status === 'atribuido' && (
                          <>
                            <Link href={`/malotes/${m.id}/registrar`} className="btn btn-xs bg-green-600 text-white hover:bg-green-700">
                              ✓ Entregue
                            </Link>
                            <Link href={`/malotes/${m.id}/registrar?resultado=insucesso`} className="btn btn-xs bg-red-500 text-white hover:bg-red-600">
                              ✗ Insucesso
                            </Link>
                          </>
                        )}
                        {m.status === 'aguardando_atribuicao' && (
                          <Link href={`/malotes/${m.id}/atribuir`} className="btn btn-xs btn-primary">
                            Atribuir
                          </Link>
                        )}
                        {!['atribuido','aguardando_atribuicao'].includes(m.status) && (
                          <Link href={`/malotes/${m.id}`} className="btn btn-xs">
                            Ver
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
              {!malotes.length && (
                <tr>
                  <td colSpan={9} className="text-center text-gray-400 py-10">
                    Nenhuma entrega encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
