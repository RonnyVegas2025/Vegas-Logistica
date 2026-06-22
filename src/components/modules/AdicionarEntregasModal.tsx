'use client'
import { useState, useRef } from 'react'
import Modal from '@/components/ui/Modal'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type Empresa = {
  id:string; razao_social:string; cnpj:string|null
  logradouro:string|null; numero:string|null; complemento:string|null
  bairro:string|null; cidade:string|null; estado:string|null; cep:string|null
  valor_entrega_padrao:number|null
}

type LinhaImport = {
  empresa_id?: string
  razao_social: string; cnpj?: string
  logradouro: string; numero?: string; complemento?: string
  bairro?: string; cidade: string; estado: string; cep?: string
  valor_entrega: number
  _ok?: boolean; _erro?: string
}

export default function AdicionarEntregasModal({ remessaId, empresas }: { remessaId:string; empresas:Empresa[] }) {
  const [open, setOpen] = useState(false)
  const [aba, setAba] = useState<'manual'|'planilha'>('manual')
  const [loading, setLoading] = useState(false)
  const [linhas, setLinhas] = useState<LinhaImport[]>([])
  const [empresa_id, setEmpresaId] = useState('')
  const [valor, setValor] = useState('')
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  function handleEmpresaChange(id: string) {
    setEmpresaId(id)
    const emp = empresas.find(e => e.id === id)
    if (emp?.valor_entrega_padrao) setValor(emp.valor_entrega_padrao.toFixed(2))
  }

  async function addManual(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const fd = new FormData(e.currentTarget)
    const res = await fetch('/api/entregas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        remessa_id: remessaId,
        empresa_id: fd.get('empresa_id'),
        valor_entrega: parseFloat(fd.get('valor_entrega') as string),
      })
    })
    if (!res.ok) { toast.error('Erro ao adicionar entrega'); setLoading(false); return }
    toast.success('Entrega adicionada!')
    setLoading(false); setEmpresaId(''); setValor('')
    router.refresh()
  }

  async function importarPlanilha(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const Papa = (await import('papaparse')).default
    Papa.parse(file, {
      header: true, skipEmptyLines: true,
      complete: (result) => {
        const rows = result.data as Record<string, string>[]
        const parsed: LinhaImport[] = rows.map(row => {
          const razao = row['razao_social'] || row['empresa'] || row['nome']
          const cnpj = row['cnpj']
          const valor = parseFloat((row['valor_entrega'] || row['valor'] || '0').replace(',','.'))
          if (!razao) return { razao_social:'', cidade:'', estado:'', logradouro:'', valor_entrega:0, _erro:'Nome inválido' }
          const empresa = empresas.find(emp => emp.cnpj === cnpj?.replace(/\D/g,'') || emp.razao_social.toLowerCase() === razao.toLowerCase())
          return {
            empresa_id: empresa?.id,
            razao_social: razao,
            cnpj: cnpj || empresa?.cnpj || undefined,
            logradouro: row['logradouro'] || row['endereco'] || empresa?.logradouro || '',
            numero: row['numero'] || empresa?.numero || undefined,
            complemento: row['complemento'] || empresa?.complemento || undefined,
            bairro: row['bairro'] || empresa?.bairro || undefined,
            cidade: row['cidade'] || empresa?.cidade || '',
            estado: row['estado'] || row['uf'] || empresa?.estado || '',
            cep: row['cep'] || empresa?.cep || undefined,
            valor_entrega: isNaN(valor) ? (empresa?.valor_entrega_padrao ?? 0) : valor,
            _ok: !!empresa,
          }
        })
        setLinhas(parsed)
      }
    })
  }

  async function importarTudo() {
    setLoading(true)
    const res = await fetch('/api/entregas/importar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ remessa_id: remessaId, entregas: linhas })
    })
    if (!res.ok) { toast.error('Erro na importação'); setLoading(false); return }
    const { count } = await res.json()
    toast.success(`${count} entregas importadas!`)
    setOpen(false); setLoading(false); setLinhas([])
    router.refresh()
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn btn-primary">+ Adicionar entregas</button>
      <Modal open={open} onClose={() => setOpen(false)} title="Adicionar entregas à remessa" size="xl">
        {/* Abas */}
        <div className="flex border-b border-gray-100">
          {(['manual','planilha'] as const).map(a => (
            <button key={a} type="button" onClick={() => setAba(a)}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${aba===a ? 'text-blue-600 border-b-2 border-blue-600 bg-white' : 'text-gray-400 bg-gray-50 hover:text-gray-600'}`}>
              {a === 'manual' ? '✏ Manual (uma por vez)' : '📊 Importar planilha (CSV/XLSX)'}
            </button>
          ))}
        </div>

        {aba === 'manual' ? (
          <form onSubmit={addManual}>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="form-label">Empresa <span className="text-red-400">*</span></label>
                <select name="empresa_id" className="form-input" required value={empresa_id}
                  onChange={e => handleEmpresaChange(e.target.value)}>
                  <option value="">Selecionar empresa...</option>
                  {empresas.map(emp => <option key={emp.id} value={emp.id}>{emp.razao_social}{emp.cnpj ? ` — ${emp.cnpj}` : ''}</option>)}
                </select>
                <p className="form-hint">Ao selecionar, o endereço e valor padrão serão preenchidos automaticamente</p>
              </div>
              {empresa_id && (() => {
                const emp = empresas.find(e => e.id === empresa_id)
                if (!emp) return null
                return (
                  <div className="col-span-2 bg-blue-50 rounded-lg p-3 text-sm text-blue-800">
                    <strong>Endereço cadastrado:</strong>{' '}
                    {[emp.logradouro, emp.numero, emp.bairro, emp.cidade, emp.estado].filter(Boolean).join(', ') || 'Sem endereço cadastrado'}
                  </div>
                )
              })()}
              <div className="col-span-2">
                <label className="form-label">Valor da entrega <span className="text-red-400">*</span></label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">R$</span>
                  <input name="valor_entrega" type="number" step="0.01" min="0" className="form-input pl-9"
                    required value={valor} onChange={e => setValor(e.target.value)} placeholder="0,00" />
                </div>
                <p className="form-hint">Valor padrão da empresa. Pode ser ajustado para esta entrega específica.</p>
              </div>
            </div>
            <div className="flex justify-end gap-2 px-5 py-4 border-t border-gray-100">
              <button type="button" onClick={() => setOpen(false)} className="btn">Fechar</button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? 'Adicionando…' : '+ Adicionar entrega'}
              </button>
            </div>
          </form>
        ) : (
          <div className="p-5">
            {/* Template download */}
            <div className="alert-info mb-4">
              <strong>Formato esperado:</strong> razao_social, cnpj, logradouro, numero, bairro, cidade, estado, cep, valor_entrega
              <br/>Se a empresa já estiver cadastrada, o sistema vincula automaticamente pelo CNPJ ou nome.
            </div>

            {linhas.length === 0 ? (
              <div>
                <div
                  className="border-2 border-dashed border-gray-200 rounded-xl p-10 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  onClick={() => fileRef.current?.click()}
                >
                  <div className="text-4xl mb-2">📊</div>
                  <div className="text-sm font-medium text-gray-600">Arraste ou clique para selecionar</div>
                  <div className="text-xs text-gray-400 mt-1">CSV ou Excel (.xlsx)</div>
                </div>
                <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={importarPlanilha} />
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="text-sm font-medium text-gray-700">
                    {linhas.length} linhas lidas ·{' '}
                    <span className="text-green-600">{linhas.filter(l=>l._ok).length} vinculadas</span>
                    {linhas.filter(l=>l._erro).length > 0 && (
                      <span className="text-red-500 ml-1">· {linhas.filter(l=>l._erro).length} com erro</span>
                    )}
                  </div>
                  <button type="button" onClick={() => { setLinhas([]); if(fileRef.current) fileRef.current.value='' }} className="btn btn-sm">
                    Trocar arquivo
                  </button>
                </div>
                <div className="border border-gray-100 rounded-lg overflow-auto max-h-72">
                  <table className="tbl w-full text-xs">
                    <thead><tr><th>Empresa</th><th>Cidade/UF</th><th>Valor</th><th>Status</th></tr></thead>
                    <tbody>
                      {linhas.map((l,i) => (
                        <tr key={i} className={l._erro ? 'bg-red-50' : l._ok ? '' : 'bg-amber-50'}>
                          <td className="font-medium">{l.razao_social}</td>
                          <td className="muted">{l.cidade}/{l.estado}</td>
                          <td>R$ {l.valor_entrega?.toFixed(2)}</td>
                          <td>{l._ok ? <span className="text-green-600">✓ Vinculada</span> : l._erro ? <span className="text-red-500">✗ {l._erro}</span> : <span className="text-amber-600">⚠ Nova empresa</span>}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button type="button" onClick={() => setOpen(false)} className="btn">Cancelar</button>
                  <button type="button" disabled={loading} onClick={importarTudo} className="btn btn-primary">
                    {loading ? 'Importando…' : `Importar ${linhas.length} entregas`}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  )
}
