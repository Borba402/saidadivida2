Atue como um desenvolvedor Full Stack sênior. Preciso criar um aplicativo web chamado **SaiDaDívida** — um Planejador Financeiro Pessoal — funcional, moderno e responsivo. O app é **gratuito e anônimo**: não coleta CPF, conta bancária nem dados sensíveis (apenas um apelido). Siga estas diretrizes:

## 1. Funcionalidades Principais

- **Perfil financeiro:** o usuário informa apelido, renda mensal, dia de recebimento (1 a 31) e, opcionalmente, renda extra (valor + nível de disponibilidade: nenhuma / baixa / média / alta).
- **Gastos (CRUD):** adicionar, editar e excluir vários gastos. Cada gasto tem categoria (ex.: Moradia, Alimentação, Lazer), valor e **tipo: Essencial ou Não-essencial**.
- **Dívidas (CRUD):** adicionar, editar e excluir várias dívidas. Cada dívida tem descrição, valor total, juros mensal (% a.m.) e parcelas restantes.
- **Geração do plano (lógica de negócio real — não é só CRUD):** ao calcular, o app retorna:
  - O **valor mensal disponível** para quitar dívidas após cortar gastos não-essenciais;
  - A **estimativa em meses** para quitação total das dívidas (considerando juros);
  - Um **cenário alternativo** considerando a renda extra;
  - **Recomendações personalizadas** geradas automaticamente por regras.
- **Filtros:** botões para filtrar a lista de gastos por 'Todos', 'Essenciais' e 'Não-essenciais'; e a lista de dívidas por 'Todas', 'Alta prioridade' e 'Baixa prioridade' (prioridade derivada do juros).
- **Histórico:** os planos gerados ficam salvos e podem ser consultados a qualquer momento.
- **Cabeçalho (Navbar):** menu com as opções 'Início', 'Meu Plano' e 'Histórico'. Botão de 'Novo plano' / 'Sair'.

## 2. Interface UI/UX

- Use a skill **frontend-design** para criar a interface.
- Use uma **paleta de cores claras**, com aparência limpa e profissional (transmitir confiança, não estresse financeiro).
- Formate todos os valores monetários em **Real (R$)** e percentuais corretamente.

## 3. Telas e Elementos Internos

**Formulário de entrada** — organizado em seções colapsáveis: Perfil / Gastos / Dívidas / Renda extra. As linhas de gastos e dívidas devem ser **adicionáveis e removíveis dinamicamente**.

**Lista de gastos e dívidas** (estilo cards/linhas):
- **Tags coloridas** para tipo de gasto (ESSENCIAL / NÃO-ESSENCIAL) e prioridade da dívida (ALTA / MÉDIA / BAIXA, calculada pelo juros mensal).
- Valor em destaque e ícone de **lixeira** no canto direito para exclusão.
- Título/descrição do item em destaque.

**Tela de resultado (Meu Plano)** — destaque em cards:
- Valor disponível mensal para quitar dívidas;
- Meses para quitação (cenário base) **vs.** meses com renda extra (comparação lado a lado);
- Bloco com a **lista de recomendações**.
- Use cores semânticas: verde para folga/positivo, vermelho/âmbar para orçamento no vermelho.

## 4. Especificações Técnicas

### 4.1 Lógica de cálculo (implementar exatamente assim)

Constantes ajustáveis no topo: `TAXA_CORTE_NAO_ESSENCIAL = 0.70`, `LIMITE_MESES = 600`.

1. `total_essencial` e `total_nao_essencial` = somatórios dos gastos por tipo.
2. `economia_mensal = total_nao_essencial * TAXA_CORTE_NAO_ESSENCIAL`.
3. `valor_disponivel = renda_mensal - total_essencial - (total_nao_essencial * (1 - TAXA_CORTE_NAO_ESSENCIAL))`.
   - Se `valor_disponivel <= 0`: não há folga → `meses_para_quitar = null` e recomende redução de gastos/aumento de renda.
4. **Meses para quitar — simulação mês a mês, método avalanche** (lida com juros e múltiplas dívidas):
   ```
   ordene as dívidas por juros_mensal DECRESCENTE
   meses = 0
   enquanto soma(saldos) > 0 e meses < LIMITE_MESES:
       meses += 1
       para cada dívida: saldo += saldo * (juros_mensal / 100)        // incide juros
       pagamento = valor_disponivel
       para cada dívida (ordem avalanche):                            // abate maior juros primeiro
           abate = min(pagamento, saldo); saldo -= abate; pagamento -= abate
           se pagamento <= 0: pare
   se meses >= LIMITE_MESES: meses_para_quitar = null  // pagamento não cobre os juros
   ```
5. **Cenário com renda extra:** repita a simulação com `valor_disponivel + valor_renda_extra` → `meses_com_renda_extra`.
6. **Recomendações** (concatenar conforme regras):
   - `total_nao_essencial > 0.25 * renda_mensal` → sugerir corte de supérfluos;
   - alguma dívida com `juros_mensal >= 8` → sugerir renegociação/portabilidade;
   - sem renda extra e folga baixa → sugerir fonte de renda extra;
   - `valor_disponivel <= 0` → alerta de orçamento no vermelho;
   - sempre uma frase final de incentivo.

Mantenha essa lógica isolada num módulo/serviço próprio (ex.: `services/calculadora.js`), separado da UI e da camada de dados.

### 4.2 Persistência de dados

Utilize o armazenamento local (**LocalStorage**) para que os dados não sumam ao atualizar a página. **Após os testes e o desenvolvimento do app, vamos migrar para o Supabase** (PostgreSQL) para armazenar as informações.

Para facilitar essa migração, isole todo o acesso a dados atrás de uma camada de repositório (ex.: `services/storage.js`) com funções como `salvarPerfil`, `listarGastos`, `salvarPlano`, `listarPlanos` — hoje implementadas sobre LocalStorage e, depois, reimplementadas sobre o Supabase **sem mudar a UI**.

### 4.3 Modelagem do banco (fase Supabase — projeto de Banco de Dados)

Quando migrarmos, o banco no Supabase deve ter **5 tabelas + 1 VIEW**, demonstrando FK com `ON DELETE CASCADE`, `CHECK constraint`, tipos variados e uma VIEW com JOIN + subquery. Gere também um `schema.sql` para rodar no SQL Editor do Supabase:

```sql
create type tipo_gasto as enum ('essencial', 'nao_essencial');
create type disponibilidade_extra_enum as enum ('nenhuma', 'baixa', 'media', 'alta');

create table usuarios (
  id_usuario    bigint generated always as identity primary key,
  apelido       varchar(50) not null,
  data_cadastro timestamptz not null default now()
);

create table perfil_financeiro (
  id_perfil             bigint generated always as identity primary key,
  id_usuario            bigint not null references usuarios(id_usuario) on delete cascade,
  renda_mensal          numeric(10,2) not null check (renda_mensal >= 0),
  dia_recebimento       int not null check (dia_recebimento between 1 and 31),
  tem_renda_extra       boolean not null default false,
  valor_renda_extra     numeric(10,2) not null default 0 check (valor_renda_extra >= 0),
  disponibilidade_extra disponibilidade_extra_enum not null default 'nenhuma',
  data_preenchimento    timestamptz not null default now()
);

create table gastos (
  id_gasto  bigint generated always as identity primary key,
  id_perfil bigint not null references perfil_financeiro(id_perfil) on delete cascade,
  categoria varchar(50) not null,
  valor     numeric(10,2) not null check (valor >= 0),
  tipo      tipo_gasto not null
);

create table dividas (
  id_divida          bigint generated always as identity primary key,
  id_perfil          bigint not null references perfil_financeiro(id_perfil) on delete cascade,
  descricao          varchar(100) not null,
  valor_total        numeric(10,2) not null check (valor_total >= 0),
  juros_mensal       numeric(5,2)  not null default 0 check (juros_mensal >= 0),
  parcelas_restantes int not null check (parcelas_restantes >= 0)
);

create table planos_gerados (
  id_plano              bigint generated always as identity primary key,
  id_perfil             bigint not null references perfil_financeiro(id_perfil) on delete cascade,
  valor_economia_mensal numeric(10,2) not null,
  meses_para_quitar     int,
  meses_com_renda_extra int,
  data_geracao          timestamptz not null default now(),
  recomendacoes         text
);

create or replace view vw_resumo_perfil as
select
  p.id_perfil, u.apelido, p.renda_mensal,
  coalesce(sum(g.valor) filter (where g.tipo = 'essencial'),     0) as total_essencial,
  coalesce(sum(g.valor) filter (where g.tipo = 'nao_essencial'), 0) as total_nao_essencial,
  (select coalesce(sum(d.valor_total),0) from dividas d where d.id_perfil = p.id_perfil) as total_dividas
from perfil_financeiro p
join usuarios u on u.id_usuario = p.id_usuario
left join gastos g on g.id_perfil = p.id_perfil
group by p.id_perfil, u.apelido, p.renda_mensal;
```

Guarde as credenciais do Supabase em variáveis de ambiente (`.env`), nunca no código, e adicione `.env` ao `.gitignore`.

## 5. Entregável

Desenvolva utilizando **React com Tailwind CSS** (ou a stack de sua preferência), garantindo que o layout seja **responsivo** (mobile e desktop). Estruture o código de forma limpa: componentes de UI, camada de serviços (`calculadora`, `storage`) e estado isolados, prontos para a troca de LocalStorage por Supabase sem reescrever a interface.

## 6. Use outras skills caso seja necessário.
