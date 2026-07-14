import { z } from 'zod'

export const EnderecoEntregaSchema = z.object({
  nome_identificador: z.string().min(1, 'Identificador obrigatório').max(100),
  origem: z.enum(['cadastral', 'manual']).default('manual'),
  logradouro: z.string().min(2, 'Logradouro obrigatório').max(200),
  numero: z.string().max(20).optional().or(z.literal('')),
  complemento: z.string().max(100).optional().or(z.literal('')),
  bairro: z.string().max(100).optional().or(z.literal('')),
  cidade: z.string().min(2, 'Cidade obrigatória').max(100),
  estado: z.string().length(2, 'UF deve ter 2 caracteres'),
  cep: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos').optional().or(z.literal('')),
  responsavel_nome: z.string().max(100).optional().or(z.literal('')),
  responsavel_telefone: z.string().max(20).optional().or(z.literal('')),
  horario_permitido: z.string().max(100).optional().or(z.literal('')),
  ponto_referencia: z.string().max(200).optional().or(z.literal('')),
  instrucoes_entrega: z.string().max(1000).optional().or(z.literal('')),
  principal: z.boolean().default(false),
  ativo: z.boolean().default(true),
})

export type EnderecoEntregaInput = z.infer<typeof EnderecoEntregaSchema>
