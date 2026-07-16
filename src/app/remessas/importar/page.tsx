import ImportarRemessaWizard from '@/components/modules/ImportarRemessaWizard'

export const dynamic = 'force-dynamic'

export default function ImportarRemessaPage() {
  return (
    <div className="fade-in">
      <div className="page-h">
        <div>
          <h1 className="page-title">Importar remessa</h1>
          <p className="page-sub">Importe uma planilha de malotes e crie a remessa automaticamente</p>
        </div>
      </div>
      <ImportarRemessaWizard />
    </div>
  )
}
