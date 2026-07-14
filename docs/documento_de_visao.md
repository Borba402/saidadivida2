# Documento de Visão
## SaiDaDívida v2

---

## 1. Identificação do Sistema

| Campo | Descrição |
|---|---|
| **Nome do Sistema** | SaiDaDívida |
| **Versão** | 2.0 |
| **Data** | Julho de 2026 |
| **Tipo** | Aplicação Web (PWA) |

---

## 2. Objetivo

O **SaiDaDívida** é um sistema de gestão financeira pessoal desenvolvido para ajudar usuários a organizar suas despesas mensais, acompanhar pagamentos, registrar rendas e manter o controle das próprias finanças de forma simples e visual.

O sistema permite que cada usuário registre seus compromissos financeiros mês a mês, categorizando gastos, acompanhando vencimentos e monitorando quais contas já foram pagas.

---

## 3. Problema que o Sistema Resolve

Muitas pessoas enfrentam dificuldades para controlar suas despesas mensais. Sem uma ferramenta adequada, é comum:

- Esquecer datas de vencimento de contas;
- Não saber quanto já foi pago e quanto ainda falta;
- Perder a noção de quanto sobra do salário após os compromissos;
- Não ter histórico organizado dos meses anteriores.

O SaiDaDívida resolve esses problemas centralizando todas as informações financeiras em um único lugar, acessível de qualquer dispositivo.

---

## 4. Público-Alvo

| Perfil | Descrição |
|---|---|
| **Usuário Principal** | Pessoas físicas que desejam organizar suas finanças pessoais |
| **Perfil de Uso** | Jovens e adultos com acesso à internet e dispositivos móveis |
| **Nível Técnico** | Nenhum conhecimento técnico necessário |

---

## 5. Funcionalidades Principais

- Cadastro e autenticação de usuários (email/senha e Google OAuth)
- Registro de compromissos financeiros mensais
- Controle de despesas por categoria
- Marcação de contas como pagas
- Registro de rendas extras
- Gerenciamento de tarefas pessoais
- Notificações push para lembretes de vencimento
- Integração com o Telegram para alertas
- Avaliação anônima do sistema

---

## 6. Benefícios Esperados

| Benefício | Descrição |
|---|---|
| **Organização** | Centraliza todas as despesas mensais em um único sistema |
| **Controle** | Permite acompanhar quais contas foram pagas e quais ainda estão pendentes |
| **Planejamento** | Mostra quanto da renda sobra após os compromissos |
| **Histórico** | Mantém registros de meses anteriores para comparação |
| **Acessibilidade** | Disponível em qualquer dispositivo com acesso à internet |
| **Lembretes** | Notificações via push e Telegram evitam esquecimentos |

---

## 7. Escopo do Sistema

### Está dentro do escopo:
- Controle financeiro pessoal (pessoa física)
- Gestão de despesas mensais por usuário
- Registro de renda mensal e rendas extras
- Tarefas pessoais
- Notificações e lembretes
- Avaliações da plataforma

### Está fora do escopo:
- Gestão financeira empresarial
- Integração com bancos ou sistemas de pagamento
- Emissão de notas fiscais ou documentos fiscais
- Controle de múltiplos usuários por conta (contas familiares)

---

## 8. Tecnologias Utilizadas

| Camada | Tecnologia |
|---|---|
| **Frontend** | React, TypeScript, Vite, Tailwind CSS |
| **Backend / BaaS** | Supabase |
| **Banco de Dados** | PostgreSQL (via Supabase) |
| **Autenticação** | Supabase Auth, Google OAuth 2.0 |
| **Hospedagem** | Vercel (frontend), Supabase Cloud (backend) |
| **Notificações** | Web Push API, Telegram Bot API |
