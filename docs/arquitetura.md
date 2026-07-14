# Arquitetura do Sistema
## SaiDaDívida v2

---

## 1. Visão Geral

O SaiDaDívida utiliza uma arquitetura moderna baseada em **BaaS (Backend as a Service)**, onde o Supabase é responsável por toda a infraestrutura de backend (banco de dados, autenticação e APIs), enquanto o frontend é uma aplicação React hospedada na Vercel.

---

## 2. Diagrama de Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                      USUÁRIO                            │
│              (Navegador / Dispositivo Móvel)            │
└─────────────────────┬───────────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────┐
│                    VERCEL (CDN)                         │
│              Frontend — React + TypeScript              │
│         Interface do usuário, componentes, rotas        │
└──────┬──────────────────────────────────┬───────────────┘
       │ REST API / Realtime              │ Web Push API
       ▼                                  ▼
┌─────────────────────┐        ┌──────────────────────────┐
│   SUPABASE CLOUD    │        │   SERVIÇO DE NOTIFICAÇÃO │
│                     │        │   (Push Notifications)   │
│  ┌───────────────┐  │        └──────────────────────────┘
│  │  Supabase     │  │
│  │  Auth         │  │        ┌──────────────────────────┐
│  │  (Login/OAuth)│  │        │   TELEGRAM BOT API       │
│  └───────────────┘  │◄───────│   Webhook — Vercel       │
│                     │        └──────────────────────────┘
│  ┌───────────────┐  │
│  │  PostgreSQL   │  │
│  │  Banco de     │  │
│  │  Dados + RLS  │  │
│  └───────────────┘  │
│                     │
│  ┌───────────────┐  │
│  │  Row Level    │  │
│  │  Security     │  │
│  └───────────────┘  │
└─────────────────────┘
```

---

## 3. Componentes da Arquitetura

### 3.1 Frontend — React + TypeScript (Vercel)

**Responsabilidade:** Interface com o usuário — telas, formulários, navegação e exibição de dados.

| Item | Detalhe |
|---|---|
| **Framework** | React 18 |
| **Linguagem** | TypeScript |
| **Bundler** | Vite |
| **Estilização** | Tailwind CSS |
| **Hospedagem** | Vercel (deploy automático via GitHub) |
| **Protocolo** | HTTPS |

### 3.2 Supabase Auth — Autenticação

**Responsabilidade:** Gerenciar o cadastro e login dos usuários.

| Item | Detalhe |
|---|---|
| **Métodos suportados** | E-mail + senha, Google OAuth 2.0 |
| **Tokens** | JWT (JSON Web Tokens) |
| **Sessão** | Mantida no navegador via localStorage |

### 3.3 PostgreSQL — Banco de Dados

**Responsabilidade:** Armazenar todos os dados da aplicação de forma segura e estruturada.

| Item | Detalhe |
|---|---|
| **SGBD** | PostgreSQL 15 |
| **Hospedagem** | Supabase Cloud |
| **Segurança** | Row Level Security (RLS) em todas as tabelas |
| **Tabelas** | 7 tabelas (compromissos, itens, rendas_extra, tarefas, avaliacoes, push_subscriptions, telegram_links) |

### 3.4 Web Push API — Notificações Push

**Responsabilidade:** Enviar notificações ao navegador do usuário mesmo quando o app não está aberto.

| Item | Detalhe |
|---|---|
| **Tecnologia** | Web Push API (padrão W3C) |
| **Dados armazenados** | Endpoint + chaves de criptografia (tabela `push_subscriptions`) |

### 3.5 Telegram Bot API — Integração Telegram

**Responsabilidade:** Enviar alertas e lembretes ao usuário via mensagem no Telegram.

| Item | Detalhe |
|---|---|
| **Tecnologia** | Telegram Bot API |
| **Webhook** | Função serverless hospedada na Vercel |
| **Vinculação** | Token temporário com validade (tabela `telegram_links`) |

---

## 4. Fluxo de Funcionamento

```
1. Usuário acessa o sistema pelo navegador
        ↓
2. Frontend carregado via Vercel (CDN)
        ↓
3. Usuário realiza login (Supabase Auth)
        ↓
4. Token JWT armazenado na sessão do navegador
        ↓
5. Requisições enviadas ao Supabase com o token
        ↓
6. RLS valida que o usuário acessa apenas seus dados
        ↓
7. Dados retornados e exibidos na interface
        ↓
8. Notificações enviadas via Push API ou Telegram Bot
```

---

## 5. Estratégia de Projeto

O SaiDaDívida adota uma **arquitetura centralizada** — todos os dados ficam armazenados em um único banco de dados no Supabase Cloud. Isso garante:

- Administração simplificada
- Backup gerenciado automaticamente pelo Supabase
- Consistência dos dados
- Acesso de qualquer dispositivo com internet

Essa escolha é adequada para o porte do sistema (aplicação individual) e elimina a necessidade de manter servidores próprios.
