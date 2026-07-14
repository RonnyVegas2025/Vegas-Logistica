import { createClient } from '@/lib/supabase/server'
import Badge from '@/components/ui/Badge'
import EntregadorModal from '@/components/modules/EntregadorModal'
import { createEntregador, updateEntregador, toggleEntregadorStatus } from '@/lib/actions/entregadores'

export const dynamic = 'force-dynamic'

const FORMA_LABEL: Record<string, string> = {
  presencial:'Presencial', motoboy:'Motoboy', sedex:'SEDEX',
  transportadora:'Transportadora', retirada:'Retirada', outro:'Outro'
}

export default async function EntregadoresPage() {
  const sb = createClient()
  const { data: { user } } = await sb.auth.getUser()
  const { data: usuario } = await sb.from('usuarios').select('perfil').eq('id', user!.id).single()
  const isAdmin = usuario?.perfil === 'admin'

  const { data: entregadores } = await sb
    .from('entregadores')
    .select('*, filiais(nome), parceiros(nome)')
    .order('nome')

  const { data: filiais } = await sb.from('filiais').select('id,nome').eq('ativo', true).order('nome')
  const { data: parceiros } = await sb.from('parceiros').select('id,nome').eq('ativo', true)

  return (
    <div className="fade-in">
      <div className="page-h">
        <div>
          <h1 className="page-title">Entregadores</h1>
          <p className="page-sub">Quem realiza as entregas</p>
        </div>
        {isAdmin && (
          <EntregadorModal
            action={createEntregador}
            filiais={filiais ?? []}
            parceiros={parceiros ?? []}
          />
        )}
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Entregadores cadastrados</span>
          <span className="badge bg-gray-100 text-gray-600">{entregadores?.length ?? 0}</span>
        </div>
        <div className="overflow-x-auto">
          <table className="tbl w-full">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Filial</th>
                <th>Parceiro</th>
                <th>Telefone</th>
                <th>Formas habilitadas</th>
                <th>Status</th>
                {isAdmin && <th>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {(entregadores ?? []).map(e => (
                <tr key={e.id}>
                  <td>
                    <div className="font-semibold">{e.nome}</div>
                    {e.documento && <div className="text-xs text-gray-400 font-mono">{e.documento}</div>}
                  </td>
                  <td className="muted">{(e.filiais as any)?.nome ?? '—'}</td>
                  <td className="muted">{(e.parceiros as any)?.nome ?? 'Autônomo'}</td>
                  <td className="muted">{e.telefone ?? '—'}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      {((e.formas_habilitadas as string[]) ?? []).map(f => (
                        <span key={f} className="badge bg-gray-100 text-gray-600 text-xs">
                          {FORMA_LABEL[f] ?? f}
                        </span>
                      ))}
                      {!((e.formas_habilitadas as string[])?.length) && <span className="text-gray-400">—</span>}
                    </div>
                  </td>
                  <td><Badge s={e.ativo ? 'ativo' : 'inativo'} /></td>
                  {isAdmin && (
                    <td className="flex items-center gap-2">
                      <EntregadorModal
                        entregador={e}
                        action={updateEntregador}
                        filiais={filiais ?? []}
                        parceiros={parceiros ?? []}
                      />
                      <form action={toggleEntregadorStatus.bind(null, e.id, e.ativo)}>
                        <button className={`btn btn-xs ${e.ativo ? 'btn-danger' : ''}`}>
                          {e.ativo ? 'Inativar' : 'Ativar'}
                        </button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
              {!entregadores?.length && (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="text-center text-gray-400 py-10">
                    Nenhum entregador cadastrado
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
