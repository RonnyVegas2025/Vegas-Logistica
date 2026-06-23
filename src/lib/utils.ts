import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...i: ClassValue[]) { return twMerge(clsx(i)) }

export function fmt_date(d: string | Date | null, pattern = 'dd/MM/yyyy') {
  if (!d) return '—'
  return format(typeof d === 'string' ? parseISO(d) : d, pattern, { locale: ptBR })
}

export function fmt_money(v: number | null | undefined) {
  if (v == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)
}

export function endereco_str(e: {
  endereco_logradouro?: string|null; endereco_numero?: string|null
  endereco_bairro?: string|null; endereco_cidade?: string|null; endereco_estado?: string|null
}) {
  return [e.endereco_logradouro, e.endereco_numero, e.endereco_bairro,
    e.endereco_cidade && `${e.endereco_cidade}/${e.endereco_estado}`].filter(Boolean).join(', ')
}
