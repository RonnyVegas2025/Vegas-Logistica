import { createClient } from '@/lib/supabase/server'
import { fmt_money } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import EmpresaModal from '@/components/modules/EmpresaModal'

export const dynamic = 'force-dynamic'

export default async function EmpresasPage() {
  const sb = createClient()
  const { data: empresas } = await sb.from('empresas').select('*, parceiros(nome)').order('razao_social')
  const { data: parceiros } = await sb.from('parceiros').select('id,nome').eq('ativo',true)
  return (
    <div className="fade-in">
      <div className="page-h">
        <div><h1 className="page-title">Empresas</h1><p className="page-sub">Destinatários de cartões</p></div>
        <EmpresaModal parceiros={parceiros??[]} />
      </div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Empresas cadastradas</span>
          <span className="badge bg-gray-100 text-gray-600">{empresas?.length??0}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead><tr>
              <th>Razão social</th><th>CNPJ</th><th>Cidade/UF</th>
              <th>Valor padrão entrega</th><th>Parceiro padrão</th><th>Status</th><th></th>
            </tr></thead>
            <tbody>
              {(empresas??[]).map(e=>(
                <tr key={e.id}>
                  <td className="font-semibold">{e.razao_social}</td>
                  <td className="mono">{e.cnpj??'—'}</td>
                  <td className="muted">{[e.cidade,e.estado].filter(Boolean).join('/')||'—'}</td>
                  <td className="font-semibold text-blue-700">{fmt_money(e.valor_entrega_padrao)}</td>
                  <td className="muted">{(e.parceiros as any)?.nome??'—'}</td>
                  <td><Badge s={e.ativo?'ativo':'inativo'}/></td>
                  <td><EmpresaModal empresa={e} parceiros={parceiros??[]} /></td>
                </tr>
              ))}
              {!empresas?.length && <tr><td colSpan={7} className="text-center text-gray-400 py-10">Nenhuma empresa cadastrada</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
