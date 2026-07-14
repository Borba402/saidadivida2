# Segurança do Sistema
## SaiDaDívida v2

---

## 1. Perfis de Acesso

O SaiDaDívida possui três perfis de acesso com permissões distintas:

| Perfil | Descrição | Permissões |
|---|---|---|
| **Visitante** | Usuário não autenticado | Pode visualizar a landing page e enviar avaliações anônimas |
| **Usuário Autenticado** | Usuário com conta criada e sessão ativa | Acessa todas as funcionalidades do sistema, limitado aos seus próprios dados |
| **Service Role** | Servidor da aplicação (webhook Vercel) | Acesso total ao banco de dados, usado exclusivamente para operações do Telegram Bot |

---

## 2. Autenticação

O sistema utiliza o **Supabase Auth** para gerenciar a identidade dos usuários.

| Método | Descrição |
|---|---|
| **E-mail + Senha** | Cadastro e login com credenciais próprias |
| **Google OAuth 2.0** | Login com conta Google, sem necessidade de criar senha |

Após a autenticação, um **token JWT (JSON Web Token)** é gerado e armazenado na sessão do navegador. Esse token é enviado em todas as requisições ao banco de dados para identificar o usuário.

---

## 3. Row Level Security (RLS)

O mecanismo principal de segurança dos dados é o **Row Level Security (RLS)** do PostgreSQL, ativado em todas as tabelas do sistema.

### Como funciona

Sem o RLS, qualquer consulta ao banco retornaria todos os registros de todos os usuários. Com o RLS ativo, o banco filtra automaticamente os dados com base no token do usuário logado — **nenhuma linha de outro usuário é retornada, independentemente da consulta**.

### Políticas por tabela

| Tabela | Política | Descrição |
|---|---|---|
| `compromissos` | Usuário dono | O usuário acessa apenas os registros onde `user_id = auth.uid()` |
| `itens_compromisso` | Via compromisso do dono | O usuário acessa apenas itens vinculados aos seus compromissos |
| `rendas_extra` | Via compromisso do dono | O usuário acessa apenas rendas vinculadas aos seus compromissos |
| `tarefas` | Usuário dono | O usuário acessa apenas as tarefas onde `user_id = auth.uid()` |
| `avaliacoes` | Pública | Qualquer pessoa pode inserir e ler avaliações (anônimas) |
| `push_subscriptions` | Usuário dono | O usuário acessa apenas sua própria inscrição push |
| `telegram_links` | Usuário dono + Service Role | O usuário acessa seu vínculo; o servidor (webhook) tem acesso total |

---

## 4. Proteção dos Dados

| Aspecto | Solução Adotada |
|---|---|
| **Comunicação** | Todas as requisições usam HTTPS (criptografia em trânsito) |
| **Senhas** | Nunca armazenadas em texto puro — gerenciadas pelo Supabase Auth com hash seguro |
| **Tokens** | JWT com validade limitada, renovados automaticamente |
| **Dados em repouso** | Armazenados nos servidores do Supabase Cloud com criptografia em disco |
| **Isolamento de dados** | RLS garante que nenhum usuário acessa dados de outro usuário |

---

## 5. Segurança da Integração Telegram

A vinculação com o Telegram utiliza um mecanismo de token temporário:

1. O usuário solicita a vinculação no sistema
2. O sistema gera um **token único** com data de expiração
3. O usuário envia esse token para o Bot do Telegram
4. O Bot valida o token via webhook (Vercel) usando a chave `service_role`
5. Se válido e dentro do prazo, a conta é vinculada

Esse mecanismo garante que apenas o dono da conta possa vincular seu perfil ao Telegram.

---

## 6. O que NÃO está no escopo de segurança atual

| Item | Observação |
|---|---|
| **Logs de auditoria** | Não implementado nesta versão |
| **Bloqueio por tentativas de login** | Gerenciado pelo Supabase Auth |
| **Backup manual** | Gerenciado automaticamente pelo Supabase Cloud |
| **Autenticação em dois fatores (2FA)** | Não implementado nesta versão |
