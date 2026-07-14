import { z } from 'zod'

const FORMAS = ['presencial','motoboy','sedex','transportadora','retirada','outro'] as const

export const EntregadorSchema = z.object({
  nome: z.string().min(2, 'Nome obrigatório').max(100),
  documento: z.string().max(20).optional().or(z.literal('')),
  telefone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  parceiro_id: z.string().uuid().optional().or(z.literal('')),
  filial_id: z.string().uuid('Filial obrigatória'),
  tipo_chave_pix: z.enum(['cpf','email','telefone','aleatoria']).optional().or(z.literal('')),
  chave_pix: z.string().max(150).optional().or(z.literal('')),
  banco: z.string().max(100).optional().or(z.literal('')),
  agencia: z.string().max(20).optional().or(z.literal('')),
  conta: z.string().max(30).optional().or(z.literal('')),
  formas_habilitadas: z
    .array(z.enum(FORMAS))
    .min(1, 'Selecione ao menos uma forma de entrega'),
  observacoes: z.string().max(1000).optional().or(z.literal('')),
  ativo: z.boolean().default(true),
})

export type EntregadorInput = z.infer<typeof EntregadorSchema>
