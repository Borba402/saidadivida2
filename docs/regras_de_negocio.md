# Regras de Negócio
## SaiDaDívida v2

---

## O que são Regras de Negócio?

Regras de negócio são normas e restrições que o sistema deve respeitar para garantir que os dados sejam consistentes e que o comportamento da aplicação esteja de acordo com as necessidades do projeto.

---

## Regras Definidas

| Código | Regra | Descrição |
|---|---|---|
| RN01 | Unicidade do compromisso mensal | Um usuário não pode ter dois compromissos para o mesmo mês de referência. Cada mês é único por usuário |
| RN02 | Vínculo obrigatório do item | Todo item de despesa deve estar vinculado a um compromisso mensal existente. Não é possível criar itens sem um mês associado |
| RN03 | Vínculo obrigatório da renda extra | Toda renda extra deve estar vinculada a um compromisso mensal existente |
| RN04 | Nota da avaliação entre 1 e 5 | A nota de uma avaliação deve ser um número inteiro entre 1 e 5. Valores fora desse intervalo são rejeitados pelo banco de dados |
| RN05 | Avaliação anônima | As avaliações do sistema não exigem autenticação. Qualquer visitante pode avaliar |
| RN06 | Inscrição push única | Cada usuário pode ter apenas uma inscrição push ativa. Uma nova inscrição substitui a anterior |
| RN07 | Vínculo Telegram único | Cada usuário pode ter apenas um vínculo com o Telegram ativo |
| RN08 | Token de vinculação com validade | O token gerado para vincular a conta ao Telegram possui data de expiração. Após esse prazo, é necessário gerar um novo token |
| RN09 | Exclusão em cascata | Ao excluir um usuário, todos os seus dados são removidos automaticamente (compromissos, itens, tarefas, etc.) |
| RN10 | Exclusão em cascata do compromisso | Ao excluir um compromisso mensal, todos os itens de despesa e rendas extras associados são removidos automaticamente |
| RN11 | Status de pagamento padrão | Todo item de despesa é criado com status "não pago" por padrão. O usuário deve marcar manualmente quando efetuar o pagamento |
| RN12 | Categoria padrão | Itens de despesa sem categoria definida são automaticamente classificados como "Outros" |
| RN13 | Prioridade padrão da tarefa | Tarefas criadas sem prioridade definida recebem automaticamente a prioridade "normal" |
| RN14 | Acesso restrito por usuário | Nenhum usuário pode visualizar, editar ou excluir dados de outro usuário |

---

## Como as Regras são Aplicadas no Sistema

As regras de negócio do SaiDaDívida são aplicadas em duas camadas:

### Camada do Banco de Dados (PostgreSQL / Supabase)
- **RN01** é garantida pela restrição `UNIQUE(user_id, mes_referencia)` na tabela `compromissos`
- **RN04** é garantida pela restrição `CHECK (nota BETWEEN 1 AND 5)` na tabela `avaliacoes`
- **RN06 e RN07** são garantidas pelo `UNIQUE` no campo `user_id` nas respectivas tabelas
- **RN09 e RN10** são garantidas pelo `ON DELETE CASCADE` nas chaves estrangeiras
- **RN11** é garantida pelo valor padrão `DEFAULT FALSE` no campo `pago`
- **RN12** é garantida pelo valor padrão `DEFAULT 'Outros'` no campo `categoria`
- **RN13** é garantida pelo valor padrão `DEFAULT 'normal'` no campo `prioridade`
- **RN14** é garantida pelo Row Level Security (RLS) aplicado em todas as tabelas

### Camada da Aplicação (Frontend / React)
- Validações de formulário impedem o envio de dados incompletos ou incorretos
- Mensagens de erro informam o usuário sobre restrições antes de acessar o banco de dados
