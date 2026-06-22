import { createClient } from '@/lib/supabase/server'
import Badge from '@/components/ui/Badge'
import EntregadorModal from '@/components/modules/EntregadorModal'

export const dynamic = 'force-dynamic'

export default async function EntregadoresPage() {
  const sb = createClient()
  const { data: entregadores } = await sb.from('entregadores').select('*, parceiros(nome)').order('nome')
  const { data: parceiros } = await sb.from('parceiros').select('id,nome').eq('ativo',true)
  return (
    <div className="fade-in">
      <div className="page-h">
        <div><h1 className="page-title">Entregadores</h1><p className="page-sub">Quem realiza as entregas</p></div>
        <EntregadorModal parceiros={parceiros??[]} />
      </div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Entregadores cadastrados</span>
          <span className="badge bg-gray-100 text-gray-600">{entregadores?.length??0}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead><tr><th>Nome</th><th>Documento</th><th>Parceiro (empresa)</th><th>Telefone</th><th>Chave Pix</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {(entregadores??[]).map(e=>(
                <tr key={e.id}>
                  <td className="font-semibold">{e.nome}</td>
                  <td className="mono">{e.documento??'—'}</td>
                  <td className="muted">{(e.parceiros as any)?.nome??'Autônomo'}</td>
                  <td className="muted">{e.telefone??'—'}</td>
                  <td className="muted text-xs">{e.chave_pix??'—'}</td>
                  <td><Badge s={e.ativo?'ativo':'inativo'}/></td>
                  <td><EntregadorModal entregador={e} parceiros={parceiros??[]} /></td>
                </tr>
              ))}
              {!entregadores?.length && <tr><td colSpan={7} className="text-center text-gray-400 py-10">Nenhum entregador cadastrado</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
