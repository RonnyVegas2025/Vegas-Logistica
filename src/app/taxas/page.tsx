import { createClient } from '@/lib/supabase/server'
import Badge from '@/components/ui/Badge'
import TaxaModal from '@/components/modules/TaxaModal'
import { createTaxa, updateTaxa, toggleTaxaStatus } from '@/lib/actions/taxas'

export const dynamic = 'force-dynamic'

export default async function TaxasPage() {
  const sb = createClient()
  const { data: taxas } = await sb
    .from('taxas_entrega_cidade')
    .select('*')
    .order('estado')
    .order('cidade')

  return (
    <div className="fade-in">
      <div className="page-h">
        <div>
          <h1 className="page-title">Taxas por cidade</h1>
          <p className="page-sub">Valor padrão de entrega por cidade/estado</p>
        </div>
        <TaxaModal action={createTaxa} />
      </div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Taxas cadastradas</span>
          <span className="badge bg-gray-100 text-gray-600">{taxas?.length ?? 0}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead>
              <tr>
                <th>Cidade</th>
                <th>Estado</th>
                <th>Valor padrão</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {(taxas ?? []).map(t => (
                <tr key={t.id}>
                  <td className="font-medium">{t.cidade}</td>
                  <td className="mono font-semibold">{t.estado}</td>
                  <td className="font-semibold text-blue-700">
                    {new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(t.valor_padrao)}
                  </td>
                  <td><Badge s={t.ativo ? 'ativo' : 'inativo'} /></td>
                  <td className="flex items-center gap-2">
                    <TaxaModal taxa={t} action={updateTaxa} />
                    <form action={toggleTaxaStatus.bind(null, t.id, t.ativo)}>
                      <button className={`btn btn-xs ${t.ativo ? 'btn-danger' : ''}`}>
                        {t.ativo ? 'Inativar' : 'Ativar'}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {!taxas?.length && (
                <tr>
                  <td colSpan={5} className="text-center text-gray-400 py-10">
                    Nenhuma taxa cadastrada
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
