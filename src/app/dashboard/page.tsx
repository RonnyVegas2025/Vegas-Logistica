export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return (
    <div className="fade-in">
      <div className="page-h">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-sub">Visão geral operacional</p>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="stat"><div className="stat-label">Remessas abertas</div><div className="stat-value text-blue-600">0</div></div>
        <div className="stat"><div className="stat-label">Pendentes entrega</div><div className="stat-value text-amber-600">0</div></div>
        <div className="stat"><div className="stat-label">Entregues hoje</div><div className="stat-value text-green-600">0</div></div>
        <div className="stat"><div className="stat-label">Insucessos</div><div className="stat-value text-red-500">0</div></div>
        <div className="stat"><div className="stat-label">A pagar</div><div className="stat-value">R$ 0,00</div></div>
      </div>
      <div className="card">
        <div className="card-header"><span className="card-title">Sistema em validação</span></div>
        <div className="card-body text-gray-400 text-sm">
          Navegue pelo menu lateral para validar as telas da Sprint 1.
        </div>
      </div>
    </div>
  )
}
