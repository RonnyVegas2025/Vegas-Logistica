'use client'
import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { criarFechamentoSelecionado, aprovarFechamento, marcarPago } from '@/lib/actions/fechamento'
import { toast } from 'sonner'

const fmt = (v: number) => new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(v)
const fmtDate = (d: string) => new Date(d.includes('T') ? d : `${d}T12:00:00`).toLocaleDateString('pt-BR')

interface Props {
  elegiveis: any[]
  fechamentos: any[]
  parceiros: any[]
  entregadores: any[]
}

export default function FechamentoClient({ elegiveis, fechamentos, parceiros, entregadores }: Props) {
  const router = useRouter()
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set())
  const [filtroRemessa, setFiltroRemessa] = useState('')
  const [filtroEntregador, setFiltroEntregador] = useState('')
  const [tipoPgto, setTipoPgto] = useState<'nex7' | 'entregador'>('nex7')
  const [parceiro_id, setParceiroId] = useState('')
  const [entregador_id, setEntregadorId] = useState('')
  const [previsao, setPrevisao] = useState('')
  const [formaPgto, setFormaPgto] = useState('')
  const [obs, setObs] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPanel, setShowPanel] = useState(false)

  // Remessas únicas para filtro
  const remessasUnicas = useMemo(() => {
    const map: Record<string, any> = {}
    for (const m of elegiveis) {
      const r = m.remessas as any
      if (r?.id && !map[r.id]) map[r.id] = r
    }
    return Object.values(map)
  }, [elegiveis])

  // Entregadores únicos para filtro
  const entregadoresUnicos = useMemo(() => {
    const map: Record<string, any> = {}
    for (const m of elegiveis) {
      const assignments = (m.delivery_assignments as any[]) ?? []
      const enc = assignments.find(a => a.status === 'encerrada') ?? assignments[0]
      const e = enc?.entregadores
      if (e?.id && !map[e.id]) map[e.id] = e
    }
    return Object.values(map)
  }, [elegiveis])

  // Malotes filtrados
  const malotesFiltrados = useMemo(() => {
    return elegiveis.filter(m => {
      const r = m.remessas as any
      const assignments = (m.delivery_assignments as any[]) ?? []
      const enc = assignments.find(a => a.status === 'encerrada') ?? assignments[0]
      const entregadorId = enc?.entregador_id

      if (filtroRemessa && r?.id !== filtroRemessa) return false
      if (filtroEntregador && entregadorId !== filtroEntregador) return false
      return true
    })
  }, [elegiveis, filtroRemessa, filtroEntregador])

  const totalSelecionado = useMemo(() => {
    return elegiveis
      .filter(m => selecionados.has(m.id))
      .reduce((acc, m) => acc + (m.valor_autorizado ?? 0), 0)
  }, [elegiveis, selecionados])

  function toggleMalote(id: string) {
    setSelecionados(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function selecionarTodos() {
    if (selecionados.size === malotesFiltrados.length) {
      setSelecionados(new Set())
    } else {
      setSelecionados(new Set(malotesFiltrados.map(m => m.id)))
    }
  }

  function selecionarPorRemessa(remessaId: string) {
    const ids = malotesFiltrados
      .filter(m => (m.remessas as any)?.id === remessaId)
      .map(m => m.id)
    setSelecionados(prev => {
      const next = new Set(prev)
      ids.forEach(id => next.add(id))
      return next
    })
  }

  function selecionarPorEntregador(entregadorId: string) {
    const ids = malotesFiltrados.filter(m => {
      const assignments = (m.delivery_assignments as any[]) ?? []
      const enc = assignments.find(a => a.status === 'encerrada') ?? assignments[0]
      return enc?.entregador_id === entregadorId
    }).map(m => m.id)
    setSelecionados(prev => {
      const next = new Set(prev)
      ids.forEach(id => next.add(id))
      return next
    })
  }

  async function handleCriarFechamento() {
    if (selecionados.size === 0) { toast.error('Selecione ao menos um malote'); return }
    if (tipoPgto === 'nex7' && !parceiro_id) { toast.error('Selecione o parceiro'); return }
    if (tipoPgto === 'entregador' && !entregador_id) { toast.error('Selecione o entregador'); return }

    setLoading(true)
    const fd = new FormData()
    fd.append('malote_ids', JSON.stringify(Array.from(selecionados)))
    fd.append('tipo_pagamento', tipoPgto)
    fd.append('parceiro_id', parceiro_id)
    fd.append('entregador_id', entregador_id)
    fd.append('previsao_pagamento', previsao)
    fd.append('forma_pagamento', formaPgto)
    fd.append('observacoes', obs)

    const result = await criarFechamentoSelecionado(fd)
    if (result?.error) { toast.error(result.error); setLoading(false); return }

    toast.success('Fechamento criado!')
    setSelecionados(new Set())
    setShowPanel(false)
    setLoading(false)
    router.refresh()
  }

  async function handleAprovar(id: string) {
    const result = await aprovarFechamento(id)
    if (result?.error) { toast.error(result.error); return }
    router.refresh()
  }

  async function handleMarcarPago(id: string) {
    const fd = new FormData()
    fd.append('fechamento_id', id)
    const result = await marcarPago(fd)
    if (result?.error) { toast.error(result.error); return }
    router.refresh()
  }

  const totalElegivel = elegiveis.reduce((acc, m) => acc + (m.valor_autorizado ?? 0), 0)
  const fechamentosPendentes = fechamentos.filter(f => f.status !== 'pago')
  const fechamentosPagos = fechamentos.filter(f => f.status === 'pago')
  const totalPago = fechamentosPagos.reduce((acc, f) => acc + (f.valor_total ?? 0), 0)

  return (
    <div className="fade-in">
      <div className="page-h">
        <div>
          <h1 className="page-title">Fechamento financeiro</h1>
          <p className="page-sub">Selecione os malotes que deseja pagar</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="stat">
          <div className="stat-label">A fechar (elegíveis)</div>
          <div className="stat-value text-red-500">{fmt(totalElegivel)}</div>
          <div className="text-xs text-gray-400 mt-1">{elegiveis.length} malotes entregues</div>
        </div>
        <div className="stat">
          <div className="stat-label">Selecionados agora</div>
          <div className="stat-value text-blue-600">{fmt(totalSelecionado)}</div>
          <div className="text-xs text-gray-400 mt-1">{selecionados.size} malotes</div>
        </div>
        <div className="stat">
          <div className="stat-label">Fechamentos abertos</div>
          <div className="stat-value text-amber-600">{fechamentosPendentes.length}</div>
        </div>
        <div className="stat">
          <div className="stat-label">Pago (histórico)</div>
          <div className="stat-value text-green-600">{fmt(totalPago)}</div>
        </div>
      </div>

      <div className="flex gap-4">
        {/* Lista de malotes elegíveis */}
        <div className="flex-1">
          {elegiveis.length > 0 ? (
            <div className="card mb-4">
              <div className="card-header">
                <span className="card-title">Malotes elegíveis</span>
                <span className="badge bg-green-100 text-green-700 text-xs">{elegiveis.length}</span>

                {/* Filtros */}
                <div className="flex gap-2 ml-auto flex-wrap">
                  <select className="form-input text-xs py-1 h-8 w-44"
                    value={filtroRemessa} onChange={e => setFiltroRemessa(e.target.value)}>
                    <option value="">Todas as remessas</option>
                    {remessasUnicas.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.codigo_op ?? r.codigo}
                      </option>
                    ))}
                  </select>
                  <select className="form-input text-xs py-1 h-8 w-40"
                    value={filtroEntregador} onChange={e => setFiltroEntregador(e.target.value)}>
                    <option value="">Todos entregadores</option>
                    {entregadoresUnicos.map(e => (
                      <option key={e.id} value={e.id}>{e.nome}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Ações de seleção */}
              <div className="px-4 py-2 bg-gray-50 border-b border-gray-100 flex gap-2 flex-wrap">
                <button onClick={selecionarTodos} className="btn btn-xs">
                  {selecionados.size === malotesFiltrados.length && malotesFiltrados.length > 0
                    ? 'Desmarcar todos'
                    : 'Selecionar todos'}
                </button>
                {remessasUnicas.map(r => (
                  <button key={r.id} onClick={() => selecionarPorRemessa(r.id)}
                    className="btn btn-xs">
                    + {r.codigo_op ?? r.codigo}
                  </button>
                ))}
                {entregadoresUnicos.map(e => (
                  <button key={e.id} onClick={() => selecionarPorEntregador(e.id)}
                    className="btn btn-xs">
                    + {e.nome}
                  </button>
                ))}
              </div>

              <div className="overflow-x-auto">
                <table className="tbl w-full">
                  <thead>
                    <tr>
                      <th className="w-8">
                        <input type="checkbox"
                          checked={selecionados.size === malotesFiltrados.length && malotesFiltrados.length > 0}
                          onChange={selecionarTodos}
                          className="w-4 h-4"
                        />
                      </th>
                      <th>Código</th>
                      <th>Empresa</th>
                      <th>Remessa</th>
                      <th>Cidade/UF</th>
                      <th>Entregador</th>
                      <th>Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {malotesFiltrados.map(m => {
                      const empresa = m.empresas as any
                      const remessa = m.remessas as any
                      const assignments = (m.delivery_assignments as any[]) ?? []
                      const enc = assignments.find(a => a.status === 'encerrada') ?? assignments[0]
                      const entregador = enc?.entregadores
                      const selected = selecionados.has(m.id)

                      return (
                        <tr key={m.id}
                          onClick={() => toggleMalote(m.id)}
                          className={`cursor-pointer transition-colors ${selected ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                        >
                          <td onClick={e => e.stopPropagation()}>
                            <input type="checkbox"
                              checked={selected}
                              onChange={() => toggleMalote(m.id)}
                              className="w-4 h-4"
                            />
                          </td>
                          <td className="mono text-xs font-semibold">{m.codigo_op}</td>
                          <td className="text-sm font-medium">{empresa?.razao_social}</td>
                          <td>
                            <span className="mono text-xs text-blue-600">
                              {remessa?.codigo_op ?? remessa?.codigo}
                            </span>
                            <div className="text-xs text-gray-400">
                              {remessa?.data_envio ? fmtDate(remessa.data_envio) : ''}
                            </div>
                          </td>
                          <td className="text-xs text-gray-500">
                            {[m.end_cidade, m.end_estado].filter(Boolean).join('/')}
                          </td>
                          <td className="text-sm">{entregador?.nome ?? '—'}</td>
                          <td className="font-semibold text-green-700">{fmt(m.valor_autorizado)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Rodapé com total e botão */}
              {selecionados.size > 0 && (
                <div className="px-4 py-3 bg-blue-50 border-t border-blue-100 flex items-center justify-between">
                  <div className="text-sm font-semibold text-blue-700">
                    {selecionados.size} malote(s) selecionado(s) · {fmt(totalSelecionado)}
                  </div>
                  <button
                    onClick={() => setShowPanel(true)}
                    className="btn btn-primary btn-sm"
                  >
                    Gerar fechamento →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="card mb-4">
              <div className="card-body text-center py-10 text-gray-400">
                <div className="text-3xl mb-2">💰</div>
                <div className="font-medium text-gray-600 mb-1">Nenhum malote elegível</div>
                <div className="text-sm">Malotes precisam estar com status Entregue</div>
                <a href="/entregas" className="btn btn-sm btn-primary mt-3 inline-block">
                  Ver entregas →
                </a>
              </div>
            </div>
          )}

          {/* Fechamentos pendentes */}
          {fechamentosPendentes.length > 0 && (
            <div className="card mb-4">
              <div className="card-header"><span className="card-title">Pendentes de pagamento</span></div>
              <div className="overflow-x-auto">
                <table className="tbl w-full">
                  <thead>
                    <tr>
                      <th>Para quem</th>
                      <th>Tipo</th>
                      <th>Malotes</th>
                      <th>Valor</th>
                      <th>Forma</th>
                      <th>Previsão</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fechamentosPendentes.map(f => {
                      const obsF = f.observacoes ?? ''
                      const previsaoF = obsF.match(/Previsão: ([^\n]+)/)?.[1]?.trim()
                      const formaF = obsF.match(/Forma: ([^\n]+)/)?.[1]?.trim()
                      return (
                        <tr key={f.id}>
                          <td className="font-medium text-sm">
                            {(f.parceiros as any)?.nome ?? (f.entregadores as any)?.nome ?? '—'}
                          </td>
                          <td className="text-xs text-gray-500">
                            {f.tipo_pagamento === 'nex7' ? '🏢 Parceiro' : '🚴 Entregador'}
                          </td>
                          <td className="text-center">{f.quantidade_entregas}</td>
                          <td className="font-semibold text-blue-700">{fmt(f.valor_total)}</td>
                          <td className="text-xs text-gray-500">{formaF ?? '—'}</td>
                          <td className="text-xs text-gray-500">{previsaoF ?? '—'}</td>
                          <td>
                            <span className={`badge text-xs ${
                              f.status === 'aprovado'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {f.status === 'aprovado' ? 'Aprovado' : 'Pendente'}
                            </span>
                          </td>
                          <td>
                            <div className="flex gap-1">
                              {f.status === 'pendente' && (
                                <button onClick={() => handleAprovar(f.id)}
                                  className="btn btn-xs btn-primary">Aprovar</button>
                              )}
                              {f.status === 'aprovado' && (
                                <button onClick={() => handleMarcarPago(f.id)}
                                  className="btn btn-xs bg-green-600 text-white">✓ Pago</button>
                              )}
                              <a href={`/recibo/${f.id}`} target="_blank"
                                className="btn btn-xs">📄</a>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Histórico */}
          {fechamentosPagos.length > 0 && (
            <div className="card">
              <div className="card-header">
                <span className="card-title">Histórico de pagamentos</span>
                <span className="font-semibold text-green-700 ml-auto">{fmt(totalPago)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="tbl w-full">
                  <thead>
                    <tr>
                      <th>Para quem</th>
                      <th>Tipo</th>
                      <th>Malotes</th>
                      <th>Valor pago</th>
                      <th>Forma</th>
                      <th>Pago em</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fechamentosPagos.map(f => {
                      const obsF = f.observacoes ?? ''
                      const formaF = obsF.match(/Forma: ([^\n]+)/)?.[1]?.trim()
                      return (
                        <tr key={f.id}>
                          <td className="font-medium text-sm">
                            {(f.parceiros as any)?.nome ?? (f.entregadores as any)?.nome ?? '—'}
                          </td>
                          <td className="text-xs text-gray-500">
                            {f.tipo_pagamento === 'nex7' ? '🏢 Parceiro' : '🚴 Entregador'}
                          </td>
                          <td className="text-center">{f.quantidade_entregas}</td>
                          <td className="font-semibold text-green-700">{fmt(f.valor_total)}</td>
                          <td className="text-xs text-gray-500">{formaF ?? '—'}</td>
                          <td className="text-sm text-gray-500">
                            {f.pago_em ? fmtDate(f.pago_em) : '—'}
                          </td>
                          <td>
                            <a href={`/recibo/${f.id}`} target="_blank"
                              className="btn btn-xs">📄 Recibo</a>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Painel lateral de fechamento */}
        {showPanel && (
          <div className="w-80 flex-shrink-0">
            <div className="card sticky top-4">
              <div className="card-header">
                <span className="card-title">Gerar fechamento</span>
                <button onClick={() => setShowPanel(false)}
                  className="ml-auto text-gray-400 hover:text-gray-600 text-lg">×</button>
              </div>
              <div className="card-body flex flex-col gap-4">
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-700">{fmt(totalSelecionado)}</div>
                  <div className="text-xs text-blue-500">{selecionados.size} malotes selecionados</div>
                </div>

                <div>
                  <label className="form-label">Pagar para</label>
                  <div className="flex gap-2">
                    <button type="button"
                      onClick={() => setTipoPgto('nex7')}
                      className={`flex-1 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                        tipoPgto === 'nex7'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-500'
                      }`}>
                      🏢 NEX7
                    </button>
                    <button type="button"
                      onClick={() => setTipoPgto('entregador')}
                      className={`flex-1 py-2 rounded-lg border-2 text-xs font-medium transition-all ${
                        tipoPgto === 'entregador'
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-500'
                      }`}>
                      🚴 Entregador
                    </button>
                  </div>
                </div>

                {tipoPgto === 'nex7' && (
                  <div>
                    <label className="form-label">Parceiro</label>
                    <select className="form-input" value={parceiro_id}
                      onChange={e => setParceiroId(e.target.value)} required>
                      <option value="">Selecionar...</option>
                      {parceiros.map(p => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                      ))}
                    </select>
                  </div>
                )}

                {tipoPgto === 'entregador' && (
                  <div>
                    <label className="form-label">Entregador</label>
                    <select className="form-input" value={entregador_id}
                      onChange={e => setEntregadorId(e.target.value)} required>
                      <option value="">Selecionar...</option>
                      {entregadores.map(e => (
                        <option key={e.id} value={e.id}>{e.nome}</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="form-label">Forma de pagamento</label>
                  <select className="form-input" value={formaPgto}
                    onChange={e => setFormaPgto(e.target.value)}>
                    <option value="">Selecionar...</option>
                    <option value="PIX">PIX</option>
                    <option value="Depósito bancário">Depósito bancário</option>
                    <option value="Transferência bancária">Transferência bancária</option>
                    <option value="Crédito cartão Vegas Plus">Crédito cartão Vegas Plus</option>
                    <option value="Dinheiro">Dinheiro</option>
                  </select>
                </div>

                <div>
                  <label className="form-label">Previsão de pagamento</label>
                  <input type="date" className="form-input"
                    value={previsao} onChange={e => setPrevisao(e.target.value)} />
                </div>

                <div>
                  <label className="form-label">Observações</label>
                  <textarea className="form-input" rows={2}
                    value={obs} onChange={e => setObs(e.target.value)}
                    placeholder="Informações adicionais..." />
                </div>

                <button
                  onClick={handleCriarFechamento}
                  disabled={loading}
                  className="btn btn-primary w-full justify-center"
                >
                  {loading ? 'Criando...' : `Criar fechamento · ${fmt(totalSelecionado)}`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
