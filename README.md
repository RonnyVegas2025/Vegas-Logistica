# CartãoLog — Sistema de Remessas e Entregas de Cartões

Stack: **Next.js 14 + Supabase + Vercel + GitHub**

---

## Fluxo do sistema

```
Vegas (você)
  → Cria remessa diária com as empresas e valores
  → Envia para NEX7

NEX7 (parceiro) — acesso via portal
  → Vê as empresas que tem para entregar
  → Adiciona observação: "entregador João foi hoje"

Vegas (adm)
  → Lê a obs da NEX7
  → Registra oficialmente o entregador + confirma entrega
  → Anexa comprovante (protocolo ou SEDEX)

Vegas (financeiro)
  → Fecha: paga a NEX7 ou paga entregador direto
  → Histórico imutável — auditor de todas as ações
```

---

## Setup em 5 passos

### 1. Clone o repositório

```bash
git clone https://github.com/SEU_USER/cartaolog.git
cd cartaolog
npm install
```

### 2. Crie o projeto no Supabase

1. Acesse [supabase.com](https://supabase.com) → **New project**
2. Vá em **SQL Editor** → cole e execute o arquivo:
   `supabase/migrations/0001_schema.sql`
3. Copie as credenciais em **Settings > API**

### 3. Configure o `.env.local`

```bash
cp .env.example .env.local
```

Preencha:
```
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJETO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key
SUPABASE_SERVICE_ROLE_KEY=sua_service_role_key
```

### 4. Crie os usuários

**No Supabase > Authentication > Users:**
- Adicione o e-mail e senha do admin (você)
- Adicione o e-mail e senha do parceiro (NEX7)

**No SQL Editor**, vincule os usuários:

```sql
-- Admin Vegas
INSERT INTO usuarios (id, nome, email, perfil)
VALUES ('UUID_DO_AUTH_USER_ADMIN', 'Seu Nome', 'seu@email.com', 'admin');

-- Parceiro NEX7
INSERT INTO usuarios (id, nome, email, perfil, parceiro_id)
VALUES (
  'UUID_DO_AUTH_USER_PARCEIRO',
  'NEX7 Logística',
  'nex7@email.com',
  'parceiro',
  '10000000-0000-0000-0000-000000000001'  -- ID da NEX7 inserido no seed
);
```

### 5. Rode localmente

```bash
npm run dev
# Acesse: http://localhost:3000
```

---

## Deploy na Vercel

### Via GitHub (recomendado — deploy automático)

1. Suba o projeto para o GitHub:
```bash
git init
git add .
git commit -m "feat: initial commit"
git remote add origin https://github.com/SEU_USER/cartaolog.git
git push -u origin main
```

2. Acesse [vercel.com](https://vercel.com) → **Import Project** → selecione o repo

3. Adicione as **Environment Variables** na Vercel:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

4. Clique em **Deploy** — pronto!

A cada `git push` na branch `main`, a Vercel faz deploy automático.

---

## Storage (fotos de comprovantes)

No **Supabase > Storage**, crie o bucket:

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('comprovantes', 'comprovantes', false);
```

---

## Perfis de acesso

| Perfil | O que pode fazer |
|--------|-----------------|
| `admin` | Tudo: criar remessas, registrar entregas, fechamento |
| `financeiro` | Ver remessas, entregas, criar e aprovar fechamentos |
| `parceiro` | Ver remessas e entregas da sua empresa, adicionar observações |

O parceiro (NEX7) **nunca vê valores** de outras remessas, **não pode alterar** nada após o admin registrar, e o campo de observação fica **bloqueado** após o entregador ser registrado.

---

## Estrutura do projeto

```
src/
├── app/
│   ├── login/              # Tela de login
│   ├── dashboard/          # Dashboard + layout
│   ├── remessas/           # Lista de remessas
│   │   └── [id]/           # Detalhe da remessa (tela principal)
│   ├── entregas/           # Todas as entregas consolidadas
│   ├── fechamento/         # Fechamento financeiro
│   ├── empresas/           # CRUD de empresas destinatárias
│   ├── entregadores/       # CRUD de entregadores
│   └── api/                # API Routes
│       ├── remessas/
│       ├── entregas/
│       ├── empresas/
│       ├── entregadores/
│       └── fechamentos/
├── components/
│   ├── layout/             # Sidebar
│   ├── ui/                 # Badge, Modal, Stat
│   └── modules/            # Modais interativos de cada funcionalidade
├── lib/
│   ├── supabase/           # Client e server
│   └── utils.ts            # Formatação
└── types/
    └── index.ts            # Todos os tipos TypeScript
```

---

## Planilha modelo para importação

Colunas aceitas no CSV:

| Coluna | Obrigatório | Exemplo |
|--------|-------------|---------|
| razao_social | Sim | Banco Alfa S.A. |
| cnpj | Recomendado | 12.345.678/0001-90 |
| logradouro | Sim | Rua das Flores |
| numero | Não | 120 |
| bairro | Não | Centro |
| cidade | Sim | São Paulo |
| estado | Sim | SP |
| cep | Não | 01001-000 |
| valor_entrega | Sim | 70.00 |

> Se a empresa já estiver cadastrada no sistema (mesmo CNPJ ou nome), ela será vinculada automaticamente e o endereço cadastrado será usado.
