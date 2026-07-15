create table if not exists taxas_entrega_cidade (
  id            uuid primary key default uuid_generate_v4(),
  cidade        text not null,
  estado        char(2) not null,
  valor_padrao  numeric(10,2) not null,
  ativo         boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  unique (cidade, estado)
);

create trigger t_taxas_upd
  before update on taxas_entrega_cidade
  for each row execute function set_atualizado_em();
