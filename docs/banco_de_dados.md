# Banco de Dados — SaiDaDívida v2

**Plataforma:** Supabase (PostgreSQL)  
**Versão:** v2  
**Executado via:** SQL Editor do Supabase

---

## Introdução

O banco de dados do SaiDaDívida foi criado diretamente no Supabase, utilizando o PostgreSQL como motor de banco de dados relacional. Toda a segurança de acesso é gerenciada pelo mecanismo de **Row Level Security (RLS)** nativo do Supabase, garantindo que cada usuário acesse apenas os seus próprios dados.

O schema é composto por **8 tabelas** e **2 funções RPC**, cada uma com responsabilidade específica dentro da aplicação.

---

## Diagrama de Relacionamento

```
auth.users (gerenciado pelo Supabase Auth)
    ├── compromissos (1:N)
    │       ├── itens_compromisso (1:N)
    │       └── rendas_extra (1:N)
    ├── tarefas (1:N)
    ├── push_subscriptions (1:1)
    ├── telegram_links (1:1)
    └── telegram_pending_items (1:1, via telegram_links.telegram_chat_id)
```

---

## Tabelas e Comandos

---

### 1. Tabela `compromissos`

**Descrição:** Tabela principal do sistema. Representa o registro financeiro de um usuário para um determinado mês. Cada linha é única por combinação de usuário + mês de referência.

```sql
CREATE TABLE IF NOT EXISTS compromissos (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mes_referencia  TEXT NOT NULL,
  renda_mensal    DECIMAL(10,2) DEFAULT 0,
  dia_recebimento INTEGER,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, mes_referencia)
);
```

**Explicação coluna a coluna:**

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único gerado automaticamente pelo PostgreSQL |
| `user_id` | UUID | Referência ao usuário autenticado (`auth.users`). Ao deletar o usuário, os registros são removidos em cascata |
| `mes_referencia` | TEXT | Texto do mês, ex: `"Janeiro/2026"` |
| `renda_mensal` | DECIMAL | Salário/renda principal declarada pelo usuário naquele mês |
| `dia_recebimento` | INTEGER | Dia do mês em que o usuário recebe o salário |
| `created_at` | TIMESTAMPTZ | Data e hora de criação, preenchida automaticamente |
| `UNIQUE(user_id, mes_referencia)` | Restrição | Impede duplicidade — um usuário não pode ter dois registros para o mesmo mês |

---

### 2. Tabela `itens_compromisso`

**Descrição:** Tabela filha de `compromissos`. Armazena cada despesa, gasto ou compromisso financeiro dentro de um mês específico.

```sql
CREATE TABLE IF NOT EXISTS itens_compromisso (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  compromisso_id  UUID REFERENCES compromissos(id) ON DELETE CASCADE NOT NULL,
  nome_item       TEXT NOT NULL,
  valor           DECIMAL(10,2) NOT NULL DEFAULT 0,
  data_vencimento DATE,
  pago            BOOLEAN DEFAULT FALSE,
  categoria       TEXT DEFAULT 'Outros',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**Explicação coluna a coluna:**

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único do item |
| `compromisso_id` | UUID | Referência ao mês ao qual este item pertence. Deleção em cascata |
| `nome_item` | TEXT | Nome da despesa, ex: `"Aluguel"`, `"Internet"` |
| `valor` | DECIMAL | Valor monetário da despesa |
| `data_vencimento` | DATE | Data de vencimento. Pode ser `NULL` quando não há prazo definido |
| `pago` | BOOLEAN | Indica se a despesa já foi paga. Padrão: `false` |
| `categoria` | TEXT | Categoria da despesa, ex: `"Moradia"`, `"Alimentação"`. Padrão: `"Outros"` |
| `created_at` | TIMESTAMPTZ | Data e hora de criação automática |

---

### 3. Tabela `rendas_extra`

**Descrição:** Armazena rendas adicionais que o usuário teve em determinado mês, separadas da renda principal. Ex: freelances, bônus, vendas.

```sql
CREATE TABLE IF NOT EXISTS rendas_extra (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  compromisso_id  UUID REFERENCES compromissos(id) ON DELETE CASCADE NOT NULL,
  descricao       TEXT NOT NULL,
  valor           DECIMAL(10,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**Explicação coluna a coluna:**

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único da renda extra |
| `compromisso_id` | UUID | Vincula a renda ao mês de referência do usuário |
| `descricao` | TEXT | Descrição da origem da renda, ex: `"Freelance design"` |
| `valor` | DECIMAL | Valor recebido |
| `created_at` | TIMESTAMPTZ | Data e hora de criação automática |

---

### 4. Tabela `tarefas`

**Descrição:** Módulo de tarefas diárias do usuário, desvinculado do controle financeiro. Permite ao usuário organizar afazeres pessoais com prioridade e data de vencimento.

```sql
CREATE TABLE IF NOT EXISTS tarefas (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  titulo          TEXT NOT NULL,
  anotacoes       TEXT,
  data_vencimento DATE,
  concluida       BOOLEAN DEFAULT FALSE,
  prioridade      TEXT DEFAULT 'normal',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**Explicação coluna a coluna:**

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único da tarefa |
| `user_id` | UUID | Vincula a tarefa ao usuário dono |
| `titulo` | TEXT | Título ou nome da tarefa |
| `anotacoes` | TEXT | Campo opcional para notas adicionais |
| `data_vencimento` | DATE | Prazo da tarefa. Pode ser `NULL` |
| `concluida` | BOOLEAN | Indica se a tarefa foi concluída. Padrão: `false` |
| `prioridade` | TEXT | Nível de prioridade: `"baixa"`, `"normal"`, `"alta"`. Padrão: `"normal"` |
| `created_at` | TIMESTAMPTZ | Data e hora de criação automática |

---

### 5. Tabela `avaliacoes`

**Descrição:** Coleta avaliações anônimas dos visitantes da landing page. Não requer autenticação — qualquer pessoa pode enviar uma nota e comentário.

```sql
CREATE TABLE IF NOT EXISTS avaliacoes (
  id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nota       INTEGER NOT NULL CHECK (nota BETWEEN 1 AND 5),
  comentario TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Explicação coluna a coluna:**

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único da avaliação |
| `nota` | INTEGER | Nota de 1 a 5. O `CHECK` garante que valores fora desse intervalo são rejeitados pelo banco |
| `comentario` | TEXT | Comentário opcional do visitante |
| `created_at` | TIMESTAMPTZ | Data e hora de criação automática |

---

### 6. Tabela `push_subscriptions`

**Descrição:** Armazena os dados de inscrição para notificações push via Web Push API. Cada usuário possui no máximo uma inscrição ativa (`UNIQUE` no `user_id`).

```sql
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  subscription JSONB NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);
```

**Explicação coluna a coluna:**

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único do registro |
| `user_id` | UUID | Usuário dono da inscrição. `UNIQUE` garante relação 1:1 |
| `subscription` | JSONB | Objeto JSON com os dados da inscrição push (endpoint, chaves de criptografia) |
| `created_at` | TIMESTAMPTZ | Data da primeira inscrição |
| `updated_at` | TIMESTAMPTZ | Data da última atualização da inscrição |

---

### 7. Tabela `telegram_links`

**Descrição:** Gerencia a vinculação entre a conta do usuário no SaiDaDívida e o seu perfil no Telegram. Utiliza um token temporário para validar a conexão.

```sql
CREATE TABLE IF NOT EXISTS telegram_links (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  telegram_chat_id  TEXT,
  telegram_username TEXT,
  link_token        TEXT,
  token_expires_at  TIMESTAMPTZ,
  linked_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);
```

**Explicação coluna a coluna:**

| Coluna | Tipo | Descrição |
|---|---|---|
| `id` | UUID | Identificador único do vínculo |
| `user_id` | UUID | Usuário da aplicação. `UNIQUE` garante relação 1:1 |
| `telegram_chat_id` | TEXT | ID do chat do Telegram, preenchido após a vinculação |
| `telegram_username` | TEXT | Nome de usuário no Telegram |
| `link_token` | TEXT | Token temporário gerado para autenticar a vinculação |
| `token_expires_at` | TIMESTAMPTZ | Data de expiração do token de vinculação |
| `linked_at` | TIMESTAMPTZ | Data em que a vinculação foi concluída com sucesso |
| `created_at` | TIMESTAMPTZ | Data de criação do registro |

---

### 8. Tabela `telegram_pending_items`

**Descrição:** Guarda o gasto que o bot Telegram acabou de interpretar de uma mensagem, enquanto aguarda o usuário confirmar, trocar a categoria ou cancelar pelos botões inline. Uma linha por chat (`chat_id` é `PRIMARY KEY`); uma nova mensagem sobrescreve a pendência anterior daquele chat.

```sql
CREATE TABLE IF NOT EXISTS telegram_pending_items (
  chat_id         TEXT PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mes_referencia  TEXT NOT NULL,
  nome_item       TEXT NOT NULL,
  valor           DECIMAL(10,2) NOT NULL,
  categoria       TEXT NOT NULL DEFAULT 'Outros',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

**Explicação coluna a coluna:**

| Coluna | Tipo | Descrição |
|---|---|---|
| `chat_id` | TEXT | ID do chat do Telegram. `PRIMARY KEY` garante no máximo uma pendência por chat |
| `user_id` | UUID | Usuário vinculado a este chat (via `telegram_links`) |
| `mes_referencia` | TEXT | Mês em que o item será registrado quando confirmado |
| `nome_item` | TEXT | Descrição interpretada da mensagem, ex: `"mercado"` |
| `valor` | DECIMAL | Valor interpretado da mensagem |
| `categoria` | TEXT | Categoria sugerida automaticamente, editável via botão "Trocar categoria" |
| `created_at` | TIMESTAMPTZ | Data e hora em que a pendência foi criada |

---

## Funções RPC (`SECURITY DEFINER`)

Além das tabelas, o bot do Telegram usa duas funções PL/pgSQL para concentrar a lógica de escrita e leitura em uma única chamada de rede, evitando condições de corrida entre "buscar/criar compromisso" e "inserir item".

### `registrar_item(p_user_id, p_mes_referencia, p_nome_item, p_valor, p_categoria, p_data_vencimento)`

Busca o `compromissos` do usuário para o mês informado (criando um novo com `renda_mensal = 0` se ainda não existir) e insere o item em `itens_compromisso`, retornando a linha criada.

### `resumo_mes(p_user_id, p_mes_referencia)`

Retorna o resumo financeiro do mês, somando `rendas_extra` via `compromisso_id` (mesmo JOIN usado no `CompromissosTab`). Fórmula do saldo:

```
saldo = (renda_mensal + total_extras) - total_gastos
```

Também retorna `falta_pagar`, `pct` (percentual pago) e os 3 próximos vencimentos não pagos (`proximos_vencimentos`, como JSONB), usados pelo comando `/saldo` do bot.

Ambas as funções são `SECURITY DEFINER` com `search_path` fixado em `public` (evita sequestro de schema) e o `GRANT EXECUTE` é restrito a `authenticated` e `service_role`.

---

## Segurança — Row Level Security (RLS)

O Supabase utiliza o mecanismo de **Row Level Security (RLS)** do PostgreSQL para isolar os dados de cada usuário. Toda tabela tem o RLS ativado, e as políticas definem quais linhas cada usuário pode ler, criar, atualizar ou deletar.

### Ativação do RLS

```sql
ALTER TABLE compromissos      ENABLE ROW LEVEL SECURITY;
ALTER TABLE itens_compromisso ENABLE ROW LEVEL SECURITY;
ALTER TABLE rendas_extra      ENABLE ROW LEVEL SECURITY;
ALTER TABLE tarefas           ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_links    ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_pending_items ENABLE ROW LEVEL SECURITY;
```

**O comando `ENABLE ROW LEVEL SECURITY` torna a tabela completamente bloqueada por padrão.** Sem uma policy definida, nenhum usuário consegue acessar nada — nem leitura, nem escrita.

---

### Políticas por tabela

#### `compromissos` — acesso total apenas ao dono

```sql
CREATE POLICY "compromissos_user" ON compromissos
  FOR ALL USING (auth.uid() = user_id);
```

`auth.uid()` retorna o ID do usuário autenticado pela sessão atual. A policy só permite que o usuário acesse linhas onde o `user_id` seja o dele próprio.

---

#### `itens_compromisso` — acesso via compromisso do dono

```sql
CREATE POLICY "itens_user" ON itens_compromisso
  FOR ALL USING (
    compromisso_id IN (
      SELECT id FROM compromissos WHERE user_id = auth.uid()
    )
  );
```

Como `itens_compromisso` não tem `user_id` direto, a policy verifica se o `compromisso_id` pertence a um compromisso do usuário autenticado (subconsulta).

---

#### `rendas_extra` — acesso via compromisso do dono

```sql
CREATE POLICY "rendas_extra_user" ON rendas_extra
  FOR ALL USING (
    compromisso_id IN (
      SELECT id FROM compromissos WHERE user_id = auth.uid()
    )
  );
```

Mesmo padrão de `itens_compromisso`, pois também depende de `compromisso_id`.

---

#### `tarefas` — acesso total apenas ao dono

```sql
CREATE POLICY "tarefas_user" ON tarefas
  FOR ALL USING (auth.uid() = user_id);
```

---

#### `avaliacoes` — pública para leitura e inserção

```sql
CREATE POLICY "avaliacoes_insert" ON avaliacoes FOR INSERT WITH CHECK (true);
CREATE POLICY "avaliacoes_select" ON avaliacoes FOR SELECT USING (true);
```

As avaliações são anônimas. `WITH CHECK (true)` e `USING (true)` permitem que qualquer pessoa — autenticada ou não — insira e leia avaliações, sem restrição.

---

#### `push_subscriptions` — acesso total apenas ao dono

```sql
CREATE POLICY "push_sub_user" ON push_subscriptions
  FOR ALL USING (auth.uid() = user_id);
```

---

#### `telegram_links` — dono + service role

```sql
-- Usuário acessa apenas o próprio vínculo
CREATE POLICY "telegram_links_user" ON telegram_links
  FOR ALL USING (auth.uid() = user_id);

-- Service role tem acesso total (usado pelo webhook no servidor Vercel)
CREATE POLICY "telegram_links_service" ON telegram_links
  FOR ALL USING (true) WITH CHECK (true);
```

A segunda policy é necessária porque o webhook do Telegram roda no servidor (Vercel), utilizando a chave `service_role` do Supabase. Essa chave bypassa o RLS por padrão, mas a policy garante o acesso explícito para operações do servidor.

---

#### `telegram_pending_items` — apenas service role

```sql
CREATE POLICY "telegram_pending_service" ON telegram_pending_items
  FOR ALL USING (true) WITH CHECK (true);
```

Mesmo padrão de `telegram_links`: só o webhook (service role) lê e escreve nesta tabela, pois o fluxo de confirmação inline não passa pela sessão autenticada do usuário no app.


---

## Convenções Adotadas

| Convenção | Escolha | Motivo |
|---|---|---|
| Tipo de ID | `UUID` | Evita IDs sequenciais previsíveis, mais seguro |
| Geração de ID | `gen_random_uuid()` | Função nativa do PostgreSQL, sem dependência externa |
| Deleção em cascata | `ON DELETE CASCADE` | Ao deletar o usuário, todos os dados relacionados são removidos automaticamente |
| Timestamps | `TIMESTAMPTZ` | Armazena fuso horário junto com a data, evitando problemas com internacionalização |
| Valores padrão | `DEFAULT NOW()` | Preenchimento automático sem necessidade de envio pelo frontend |
| Segurança | RLS por tabela | Isolamento de dados por usuário direto no banco, sem depender só do backend |
