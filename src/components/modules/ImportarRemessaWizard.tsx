'use client'
import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import { toast } from 'sonner'
import { importarRemessa } from '@/lib/actions/importar'

interface LinhaImport {
  numero_linha: number
  id_produto: string
  empresa_nome: string
  cnpj: string
  // Resultado da análise
  status: 'ok' | 'novo' | 'sem_endereco' | 'erro'
  empresa_id?: string
  empresa_existente?: boolean
  razao_social?: string
  logradouro?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  valor_entrega?: number
  mensagem?: string
}

interface GrupoMalote {
  chave: string
  cnpj: string
  empresa_id?: string
  empresa_nome: string
  razao_social?: string
  logradouro?: string
  numero?: string
  bairro?: string
  cidade?: string
  estado?: string
  cep?: string
  valor_entrega?: number
  empresa_existente: boolean
  status: 'ok' | 'novo' | 'sem_endereco' | 'erro'
  itens: { id_produto: string; numero_linha: number }[]
}

export default function ImportarRemessaWizard() {
  const [etapa, setEtapa] = useState<'upload' | 'validando' | 'preview' | 'importando' | 'concluido'>('upload')
  const [grupos, setGrupos] = useState<GrupoMalote[]>([])
  const [dataRemessa, setDataRemessa] = useState('')
  const [nomeArquivo, setNomeArquivo] = useState('')
  const [remessaCriada, setRemessaCriada] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  async function processarArquivo(file: File) {
    setNomeArquivo(file.name)
    setEtapa('validando')

    const buffer = await file.arrayBuffer()
    const wb = XLSX.read(buffer)
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<any>(ws, { header: 1 })

    // Pula cabeçalho
    const linhas: LinhaImport[] = []
    for (let i = 1; i < rows.length; i++) {
      const row = rows[i]
      if (!row[0] && !row[1]) continue
      linhas.push({
        numero_linha: i + 1,
        id_produto: String(row[0] ?? ''),
        empresa_nome: String(row[1] ?? ''),
        cnpj: String(row[2] ?? '').replace(/\D/g, ''),
        status: 'ok',
      })
    }

    // Busca empresas existentes e taxas do servidor
    const cnpjs = Array.from(new Set(linhas.map(l => l.cnpj).filter(Boolean)))

    const res = await fetch('/api/importar/validar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cnpjs }),
    })
    const { empresas, taxas } = await res.json()

    // Busca dados na Receita para CNPJs novos
    const empresasMap: Record<string, any> = {}
    for (const e of empresas) empresasMap[e.cnpj] = e

    const taxasMap: Record<string, number> = {}
    for (const t of taxas) {
      taxasMap[`${t.cidade.toLowerCase()}|${t.estado.toUpperCase()}`] = t.valor_padrao
    }

    // Para CNPJs novos, busca na BrasilAPI
    const cnpjsNovos = cnpjs.filter(c => !empresasMap[c])
    const receitaMap: Record<string, any> = {}

    for (const cnpj of cnpjsNovos) {
      try {
        const r = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpj}`)
        if (r.ok) {
          const d = await r.json()
          receitaMap[cnpj] = d
          // Pequeno delay para não sobrecarregar a API
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      } catch {}
    }

    // Agrupa por CNPJ (mesmo CNPJ = mesmo malote)
    const gruposMap: Record<string, GrupoMalote> = {}

    for (const linha of linhas) {
      const cnpj = linha.cnpj
      if (!gruposMap[cnpj]) {
        const existente = empresasMap[cnpj]
        const receita = receitaMap[cnpj]

        const cidade = existente?.cidade || receita?.municipio || ''
        const estado = existente?.estado || receita?.uf || ''
        let valor_entrega = existente?.valor_entrega_padrao

        // Busca taxa pela cidade
        if (!valor_entrega && cidade && estado) {
          const chaveT = `${cidade.toLowerCase()}|${estado.toUpperCase()}`
          valor_entrega = taxasMap[chaveT]
        }

        let status: GrupoMalote['status'] = 'ok'
        if (!existente && !receita) status = 'erro'
        else if (!existente) status = 'novo'
        else if (!cidade) status = 'sem_endereco'

        gruposMap[cnpj] = {
          chave: cnpj,
          cnpj,
          empresa_id: existente?.id,
          empresa_nome: linha.empresa_nome,
          razao_social: existente?.razao_social || receita?.razao_social,
          logradouro: existente?.logradouro || receita?.logradouro,
          numero: existente?.numero || receita?.numero,
          bairro: existente?.bairro || receita?.bairro,
          cidade,
          estado,
          cep: existente?.cep || (receita?.cep || '').replace(/\D/g,''),
          valor_entrega: valor_entrega || 0,
          empresa_existente: !!existente,
          status,
          itens: [],
        }
      }
      gruposMap[cnpj].itens.push({ id_produto: linha.id_produto, numero_linha: linha.numero_linha })
    }

    setGrupos(Object.values(gruposMap))
    setEtapa('preview')
  }

  function atualizarGrupo(cnpj: string, campo: string, valor: string | number) {
    setGrupos(prev => prev.map(g => {
      if (g.cnpj !== cnpj) return g
      const atualizado = { ...g, [campo]: valor }
      // Recalcula status
      if (atualizado.cidade && atualizado.estado) {
        atualizado.status = atualizado.empresa_existente ? 'ok' : 'novo'
      }
      return atualizado
    }))
  }

  async function confirmarImportacao() {
    if (!dataRemessa) { toast.error('Informe a data da remessa'); return }

    const semEndereco = grupos.filter(g => !g.cidade || !g.estado)
    if (semEndereco.length > 0) {
      toast.error(`${semEndereco.length} malote(s) sem cidade/estado. Preencha antes de importar.`)
      return
    }

    setEtapa('importando')

    const fd = new FormData()
    fd.append('data_remessa', dataRemessa)
    fd.append('nome_arquivo', nomeArquivo)
    fd.append('grupos', JSON.stringify(grupos))

    const result = await importarRemessa(fd)
    if (result?.error) {
      toast.error(result.error)
      setEtapa('preview')
      return
    }

    setRemessaCriada(result.codigo_op ?? null)
    setEtapa('concluido')
  }

  const totalOk = grupos.filter(g => g.status === 'ok').length
  const totalNovo = grupos.filter(g => g.status === 'novo').length
  const totalErro = grupos.filter(g => g.status === 'erro').length
  const totalItens = grupos.reduce((acc, g) => acc + g.itens.length, 0)

  return (
    <div>
      {/* ETAPA: UPLOAD */}
      {etapa === 'upload' && (
        <div className="card max-w-lg mx-auto">
          <div className="card-header"><span className="card-title">Selecionar planilha</span></div>
          <div className="card-body flex flex-col gap-4">
            <div>
              <label className="form-label">Data da remessa <span className="text-red-400">*</span></label>
              <input type="date" className="form-input" value={dataRemessa}
                onChange={e => setDataRemessa(e.target.value)} />
            </div>
            <div
              className="border-2 border-dashed border-gray-200 rounded-lg p-10 text-center cursor-pointer hover:border-blue-400 transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              <div className="text-4xl mb-3">📊</div>
              <div className="font-medium text-gray-700">Clique para selecionar a planilha</div>
              <div className="text-sm text-gray-400 mt-1">Formatos aceitos: .xlsx, .xls, .csv</div>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={e => {
                const file = e.target.files?.[0]
                if (file && dataRemessa) processarArquivo(file)
                else if (!dataRemessa) toast.error('Informe a data da remessa primeiro')
              }}
            />
          </div>
        </div>
      )}

      {/* ETAPA: VALIDANDO */}
      {etapa === 'validando' && (
        <div className="card max-w-lg mx-auto">
          <div className="card-body text-center py-12">
            <div className="text-4xl mb-4 animate-spin">⚙️</div>
            <div className="font-medium text-gray-700">Validando planilha...</div>
            <div className="text-sm text-gray-400 mt-1">
              Consultando empresas e Receita Federal
            </div>
          </div>
        </div>
      )}

      {/* ETAPA: PREVIEW */}
      {etapa === 'preview' && (
        <div className="flex flex-col gap-4">
          {/* Resumo */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="stat">
              <div className="stat-label">Total malotes</div>
              <div className="stat-value text-gray-700">{grupos.length}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Empresas existentes</div>
              <div className="stat-value text-green-600">{totalOk}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Empresas novas</div>
              <div className="stat-value text-blue-600">{totalNovo}</div>
            </div>
            <div className="stat">
              <div className="stat-label">Itens totais</div>
              <div className="stat-value text-gray-700">{totalItens}</div>
            </div>
          </div>

          {totalErro > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
              ⚠️ {totalErro} CNPJ(s) não encontrados na Receita Federal. Verifique e corrija antes de importar.
            </div>
          )}

          {/* Data e ações */}
          <div className="card">
            <div className="card-body flex items-center gap-4">
              <div className="flex-1">
                <label className="form-label">Data da remessa</label>
                <input type="date" className="form-input max-w-xs"
                  value={dataRemessa} onChange={e => setDataRemessa(e.target.value)} />
              </div>
              <div className="flex gap-2 pt-4">
                <button onClick={() => { setEtapa('upload'); setGrupos([]) }} className="btn">
                  ← Cancelar
                </button>
                <button
                  onClick={confirmarImportacao}
                  disabled={totalErro > 0}
                  className="btn btn-primary"
                >
                  ✓ Confirmar importação ({grupos.length} malotes)
                </button>
              </div>
            </div>
          </div>

          {/* Lista de malotes */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Pré-visualização dos malotes</span>
            </div>
            <div className="overflow-x-auto">
              <table className="tbl w-full">
                <thead>
                  <tr>
                    <th>Empresa</th>
                    <th>CNPJ</th>
                    <th>Cidade / UF</th>
                    <th>Valor</th>
                    <th>Itens</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {grupos.map(g => (
                    <tr key={g.cnpj} className={g.status === 'erro' ? 'bg-red-50' : g.status === 'novo' ? 'bg-blue-50' : ''}>
                      <td>
                        <div className="font-medium text-sm">{g.razao_social || g.empresa_nome}</div>
                        {g.status === 'novo' && (
                          <div className="text-xs text-blue-600">🆕 Será criada</div>
                        )}
                        {g.status === 'erro' && (
                          <div className="text-xs text-red-600">❌ CNPJ não encontrado</div>
                        )}
                      </td>
                      <td className="mono text-xs">{g.cnpj}</td>
                      <td>
                        {g.cidade && g.estado
                          ? <span className="text-sm">{g.cidade} / {g.estado}</span>
                          : (
                            <div className="flex gap-1">
                              <input
                                className="form-input text-xs w-28"
                                placeholder="Cidade"
                                defaultValue={g.cidade ?? ''}
                                onBlur={e => atualizarGrupo(g.cnpj, 'cidade', e.target.value)}
                              />
                              <input
                                className="form-input text-xs w-12"
                                placeholder="UF"
                                maxLength={2}
                                defaultValue={g.estado ?? ''}
                                onBlur={e => atualizarGrupo(g.cnpj, 'estado', e.target.value.toUpperCase())}
                              />
                            </div>
                          )
                        }
                      </td>
                      <td>
                        <input
                          className="form-input text-xs w-20"
                          type="number"
                          step="0.01"
                          defaultValue={g.valor_entrega || ''}
                          placeholder="0,00"
                          onBlur={e => atualizarGrupo(g.cnpj, 'valor_entrega', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td>
                        <span className="badge bg-blue-50 text-blue-700 text-xs">
                          {g.itens.length} {g.itens.length === 1 ? 'item' : 'itens'}
                        </span>
                      </td>
                      <td>
                        {g.status === 'ok' && <span className="badge bg-green-100 text-green-700 text-xs">✓ OK</span>}
                        {g.status === 'novo' && <span className="badge bg-blue-100 text-blue-700 text-xs">🆕 Nova</span>}
                        {g.status === 'sem_endereco' && <span className="badge bg-amber-100 text-amber-700 text-xs">⚠ Sem endereço</span>}
                        {g.status === 'erro' && <span className="badge bg-red-100 text-red-700 text-xs">❌ Erro</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ETAPA: IMPORTANDO */}
      {etapa === 'importando' && (
        <div className="card max-w-lg mx-auto">
          <div className="card-body text-center py-12">
            <div className="text-4xl mb-4 animate-spin">📦</div>
            <div className="font-medium text-gray-700">Importando remessa...</div>
            <div className="text-sm text-gray-400 mt-1">Criando empresas, malotes e itens</div>
          </div>
        </div>
      )}

      {/* ETAPA: CONCLUIDO */}
      {etapa === 'concluido' && (
        <div className="card max-w-lg mx-auto">
          <div className="card-body text-center py-12">
            <div className="text-5xl mb-4">🎉</div>
            <div className="text-xl font-bold text-gray-800 mb-2">Remessa importada!</div>
            <div className="text-sm text-gray-500 mb-6">
              Código: <span className="font-mono font-semibold">{remessaCriada}</span>
            </div>
            <div className="flex gap-2 justify-center">
              <a href="/remessas" className="btn">Ver remessas</a>
              <button onClick={() => { setEtapa('upload'); setGrupos([]); setDataRemessa(''); setNomeArquivo('') }}
                className="btn btn-primary">
                Importar outra
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
