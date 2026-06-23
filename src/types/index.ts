export type PerfilUsuario = 'admin' | 'financeiro' | 'parceiro'
export type StatusRemessa = 'rascunho' | 'enviada' | 'recebida' | 'concluida'
export type StatusEntrega = 'pendente' | 'em_andamento' | 'entregue' | 'insucesso' | 'reagendada'
export type TipoComprovante = 'protocolo_fisico' | 'sedex' | 'outro'
export type TipoPagamento = 'nex7' | 'entregador'
export type StatusFechamento = 'pendente' | 'aprovado' | 'pago'

export interface Parceiro {
  id: string; nome: string; cnpj: string | null; email: string | null
  telefone: string | null; ativo: boolean; criado_em: string
}

export interface Usuario {
  id: string; nome: string; email: string; perfil: PerfilUsuario
  parceiro_id: string | null; ativo: boolean; criado_em: string; atualizado_em: string
}

export interface Empresa {
  id: string; razao_social: string; nome_fantasia: string | null; cnpj: string | null
  logradouro: string | null; numero: string | null; complemento: string | null
  bairro: string | null; cidade: string | null; estado: string | null; cep: string | null
  telefone: string | null; email_contato: string | null
  valor_entrega_padrao: number | null; parceiro_padrao_id: string | null
  observacoes: string | null; ativo: boolean; criado_em: string; atualizado_em: string
}

export interface Entregador {
  id: string; nome: string; documento: string | null; telefone: string | null
  email: string | null; parceiro_id: string | null; tipo_chave_pix: string | null
  chave_pix: string | null; banco: string | null; agencia: string | null
  conta: string | null; observacoes: string | null; ativo: boolean
  criado_em: string; atualizado_em: string
  parceiros?: Parceiro
}

export interface Remessa {
  id: string; codigo: string; data_envio: string; data_recebimento: string | null
  parceiro_id: string; status: StatusRemessa; observacao: string | null
  criado_por: string | null; criado_em: string; atualizado_em: string
  parceiros?: Parceiro
  entregas?: EntregaResumo[]
}

export interface EntregaResumo {
  id: string; status: StatusEntrega; valor_entrega: number
}

export interface Entrega {
  id: string; remessa_id: string
  empresa_id: string; empresas?: Empresa
  endereco_logradouro: string | null; endereco_numero: string | null
  endereco_complemento: string | null; endereco_bairro: string | null
  endereco_cidade: string | null; endereco_estado: string | null; endereco_cep: string | null
  valor_entrega: number
  entregador_id: string | null; entregadores?: Entregador
  atribuido_por: string | null; atribuido_em: string | null
  status: StatusEntrega
  obs_parceiro: string | null; obs_parceiro_em: string | null
  data_entrega: string | null; nome_recebedor: string | null
  obs_entrega: string | null; tipo_comprovante: TipoComprovante | null
  comprovante_url: string | null; motivo_insucesso: string | null
  criado_em: string; atualizado_em: string
  remessas?: Remessa
}

export interface Fechamento {
  id: string; remessa_id: string | null; tipo_pagamento: TipoPagamento
  parceiro_id: string | null; entregador_id: string | null
  quantidade_entregas: number; valor_total: number; valor_acordado: number | null
  status: StatusFechamento; aprovado_por: string | null; aprovado_em: string | null
  pago_em: string | null; comprovante_pag_url: string | null
  observacoes: string | null; criado_por: string | null
  criado_em: string; atualizado_em: string
  parceiros?: Parceiro; entregadores?: Entregador; remessas?: Remessa
}

// Labels e cores
export const STATUS_REMESSA_LABEL: Record<StatusRemessa, string> = {
  rascunho: 'Rascunho', enviada: 'Enviada', recebida: 'Recebida', concluida: 'Concluída'
}
export const STATUS_ENTREGA_LABEL: Record<StatusEntrega, string> = {
  pendente: 'Pendente', em_andamento: 'Em andamento', entregue: 'Entregue',
  insucesso: 'Insucesso', reagendada: 'Reagendada'
}
export const STATUS_FECHAMENTO_LABEL: Record<StatusFechamento, string> = {
  pendente: 'Pendente', aprovado: 'Aprovado', pago: 'Pago'
}
export const STATUS_COLOR: Record<string, string> = {
  rascunho: 'bg-gray-100 text-gray-600',
  enviada: 'bg-blue-100 text-blue-700',
  recebida: 'bg-indigo-100 text-indigo-700',
  concluida: 'bg-green-100 text-green-700',
  pendente: 'bg-gray-100 text-gray-600',
  em_andamento: 'bg-blue-100 text-blue-700',
  entregue: 'bg-green-100 text-green-700',
  insucesso: 'bg-amber-100 text-amber-700',
  reagendada: 'bg-purple-100 text-purple-700',
  aprovado: 'bg-green-100 text-green-700',
  pago: 'bg-emerald-100 text-emerald-700',
}

export const MOTIVO_INSUCESSO = [
  'Ausente', 'Empresa fechada', 'Recusado pelo destinatário',
  'Endereço não localizado', 'Reagendar', 'Outros'
]
