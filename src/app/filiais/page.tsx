import { createClient } from '@/lib/supabase/server'
import Badge from '@/components/ui/Badge'
import FilialModal from '@/components/modules/FilialModal'
import { createFilial, updateFilial, toggleFilialStatus } from '@/lib/actions/filiais'

export const dynamic = 'force-dynamic'

export default async function FiliaisPage() {
  const sb = createClient()
  const { data: filiais } = await sb.from('filiais').select('*').order('nome')

  return (
    <div className="fade-in">
      <div className="page-h">
        <div>
          <h1 className="page-title">Filiais</h1>
          <p className="page-sub">Unidades operacionais</p>
        </div>
        <FilialModal action={createFilial} />
      </div>
      <div className="card">
        <div className="card-header">
          <span className="card-title">Filiais cadastradas</span>
          <span className="badge bg-gray-100 text-gray-600">{filiais?.length ?? 0}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead>
              <tr>
                <th>Código</th><th>Nome</th><th>Cidade / UF</th>
                <th>Responsável</th><th>Telefone</th><th>E-mail</th>
                <th>Status</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {(filiais ?? []).map(f => (
                <tr key={f.id}>
                  <td className="mono font-semibold">{f.code}</td>
                  <td className="font-medium">{f.nome}</td>
                  <td className="muted">{[f.cidade,f.estado].filter(Boolean).join(' / ')||'—'}</td>
                  <td className="muted">{f.responsavel||'—'}</td>
                  <td className="muted">{f.telefone||'—'}</td>
                  <td className="muted">{f.email||'—'}</td>
                  <td><Badge s={f.ativo?'ativo':'inativo'}/></td>
                  <td className="flex items-center gap-2">
                    <FilialModal filial={f} action={updateFilial}/>
                    <form action={toggleFilialStatus.bind(null,f.id,f.ativo)}>
                      <button className={`btn btn-xs ${f.ativo?'btn-danger':''}`}>
                        {f.ativo?'Inativar':'Ativar'}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {!filiais?.length && (
                <tr><td colSpan={8} className="text-center text-gray-400 py-10">Nenhuma filial cadastrada</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
