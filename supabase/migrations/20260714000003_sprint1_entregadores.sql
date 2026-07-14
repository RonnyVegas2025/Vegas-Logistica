-- ================================================================
-- Migration: 20260714000003_sprint1_entregadores.sql
-- Sprint 1 — Adiciona colunas filial_id e formas_habilitadas em entregadores
-- ================================================================

-- filial_id: vínculo obrigatório com filial (obrigatório apenas via aplicação)
alter table entregadores
  add column if not exists filial_id uuid references filiais(id);

-- formas_habilitadas: array de formas de entrega que o entregador pode executar
alter table entregadores
  add column if not exists formas_habilitadas text[] not null default '{}';

-- Índice único parcial: apenas um endereço principal ativo por empresa
-- Garante no banco a regra de unicidade do endereço principal
create unique index if not exists idx_cda_principal_por_empresa
  on company_delivery_addresses(empresa_id)
  where principal = true and ativo = true;

-- Comentários
comment on column entregadores.filial_id is
  'Filial à qual o entregador está vinculado. Obrigatório na criação via aplicação.';

comment on column entregadores.formas_habilitadas is
  'Array de formas de entrega habilitadas para este entregador. '
  'Valores: presencial, motoboy, sedex, transportadora, retirada, outro.';
