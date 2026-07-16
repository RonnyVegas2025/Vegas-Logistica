ALTER TABLE entregadores
  ADD COLUMN IF NOT EXISTS meios_pagamento text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN entregadores.meios_pagamento IS
  'Meios de pagamento aceitos pelo entregador: pix, deposito, transferencia, cartao_vegas, dinheiro';
