import { z } from 'zod'

export const FilialSchema = z.object({
  code: z
    .string()
    .min(2, 'Código mínimo 2 caracteres')
    .max(20, 'Código máximo 20 caracteres')
    .regex(/^[A-Z0-9-]+$/, 'Apenas letras maiúsculas, números e hífen')
    .transform(v => v.toUpperCase()),
  nome: z.string().min(2, 'Nome obrigatório').max(100),
  cidade: z.string().max(100).optional().or(z.literal('')),
  estado: z.string().length(2, 'UF deve ter 2 caracteres').optional().or(z.literal('')),
  responsavel: z.string().max(100).optional().or(z.literal('')),
  telefone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().email('E-mail inválido').optional().or(z.literal('')),
  ativo: z.boolean().default(true),
})

export type FilialInput = z.infer<typeof FilialSchema>
