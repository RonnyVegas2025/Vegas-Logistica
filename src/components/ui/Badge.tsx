import { cn } from '@/lib/utils'
import { STATUS_COLOR } from '@/types/index'
const LABEL: Record<string,string> = {
  rascunho:'Rascunho',enviada:'Enviada',recebida:'Recebida',concluida:'Concluída',
  pendente:'Pendente',em_andamento:'Em andamento',entregue:'Entregue',
  insucesso:'Insucesso',reagendada:'Reagendada',aprovado:'Aprovado',pago:'Pago',
  ativo:'Ativo',inativo:'Inativo',nex7:'NEX7',entregador:'Entregador',
}
export default function Badge({ s, className }: { s: string; className?: string }) {
  return <span className={cn('badge', STATUS_COLOR[s] ?? 'bg-gray-100 text-gray-600', className)}>{LABEL[s] ?? s}</span>
}
