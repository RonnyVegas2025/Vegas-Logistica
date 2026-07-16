'use client'

export default function ImprimirButton() {
  return (
    <button onClick={() => window.print()} className="btn btn-primary">
      🖨️ Imprimir / Salvar PDF
    </button>
  )
}
