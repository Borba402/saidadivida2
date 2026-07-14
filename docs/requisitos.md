# Requisitos do Sistema
## SaiDaDívida v2

---

## 1. Requisitos Funcionais

Descrevem o que o sistema deve fazer — as funcionalidades oferecidas ao usuário.

| Código | Requisito | Descrição |
|---|---|---|
| RF01 | Cadastrar usuário | O sistema deve permitir que novos usuários se cadastrem com e-mail e senha ou conta Google |
| RF02 | Realizar login | O sistema deve autenticar o usuário antes de permitir acesso às funcionalidades |
| RF03 | Registrar compromisso mensal | O usuário deve poder criar um registro financeiro para cada mês, informando renda e dia de recebimento |
| RF04 | Adicionar item de despesa | O usuário deve poder adicionar despesas ao compromisso mensal, informando nome, valor, categoria e data de vencimento |
| RF05 | Marcar despesa como paga | O usuário deve poder indicar quais despesas já foram quitadas |
| RF06 | Registrar renda extra | O usuário deve poder adicionar receitas adicionais ao mês, como freelances ou bônus |
| RF07 | Visualizar resumo financeiro | O sistema deve exibir um resumo do mês com total de despesas, total pago, saldo restante e renda total |
| RF08 | Gerenciar tarefas pessoais | O usuário deve poder criar, editar, concluir e excluir tarefas com título, prioridade e data de vencimento |
| RF09 | Receber notificações push | O sistema deve notificar o usuário sobre vencimentos próximos via notificação no navegador |
| RF10 | Vincular conta ao Telegram | O usuário deve poder conectar sua conta ao Telegram para receber alertas via mensagem |
| RF11 | Avaliar o sistema | Qualquer visitante deve poder avaliar o sistema com nota de 1 a 5 e comentário opcional, sem necessidade de login |
| RF12 | Encerrar sessão | O usuário deve poder sair do sistema a qualquer momento |

---

## 2. Requisitos Não Funcionais

Descrevem características de qualidade do sistema — não o que ele faz, mas como ele deve se comportar.

| Código | Requisito | Descrição |
|---|---|---|
| RNF01 | Segurança — autenticação | Todo acesso às funcionalidades principais exige autenticação prévia |
| RNF02 | Segurança — isolamento de dados | Cada usuário acessa apenas os seus próprios dados (garantido pelo Row Level Security do banco de dados) |
| RNF03 | Responsividade | O sistema deve funcionar corretamente em dispositivos móveis, tablets e computadores |
| RNF04 | Desempenho | As páginas devem carregar em menos de 3 segundos em conexões padrão |
| RNF05 | Disponibilidade | O sistema deve estar disponível no mínimo 99% do tempo (garantido pela infraestrutura Supabase + Vercel) |
| RNF06 | Usabilidade | A interface deve ser intuitiva, sem necessidade de treinamento prévio |
| RNF07 | Compatibilidade | O sistema deve funcionar nos principais navegadores modernos (Chrome, Firefox, Edge, Safari) |
| RNF08 | Persistência | Os dados devem ser armazenados de forma permanente e não se perder ao fechar o navegador |
| RNF09 | Privacidade | Dados financeiros dos usuários não devem ser acessíveis por outros usuários ou terceiros |
| RNF10 | Escalabilidade | A arquitetura deve suportar o crescimento no número de usuários sem necessidade de reescrita |
