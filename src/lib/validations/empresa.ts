import { z } from 'zod'

export const EmpresaSchema = z.object({
  razao_social: z.string().min(2, 'Razão social obrigatória').max(200),
  nome_fantasia: z.string().max(200).optional().or(z.literal('')),
  cnpj: z
    .string()
    .regex(/^\d{14}$/, 'CNPJ deve ter 14 dígitos numéricos')
    .optional()
    .or(z.literal('')),
  logradouro: z.string().max(200).optional().or(z.literal('')),
  numero: z.string().max(20).optional().or(z.literal('')),
  complemento: z.string().max(100).optional().or(z.literal('')),
  bairro: z.string().max(100).optional().or(z.literal('')),
  cidade: z.string().max(100).optional().or(z.literal('')),
  estado: z.string().length(2).optional().or(z.literal('')),
  cep: z.string().regex(/^\d{8}$/, 'CEP deve ter 8 dígitos').optional().or(z.literal('')),
  telefone: z.string().max(20).optional().or(z.literal('')),
  email_contato: z.string().email('E-mail inválido').optional().or(z.literal('')),
  valor_entrega_padrao: z.coerce.number().positive('Valor deve ser positivo').optional(),
  parceiro_padrao_id: z.string().uuid().optional().or(z.literal('')),
  observacoes: z.string().max(1000).optional().or(z.literal('')),
  ativo: z.boolean().default(true),
})

export type EmpresaInput = z.infer<typeof EmpresaSchema>
