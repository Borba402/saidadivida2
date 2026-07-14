# CLAUDE.md — Refatoração Visual SaiDaDívida

> Coloque este arquivo na raiz do repositório (ou cole como contexto inicial da sessão do Claude Code).
> Ele define escopo, tokens, mapeamento de categorias e regras. Os prompts de execução por fase estão em `fases-prompts-claude-code.md`.

---

## Identidade do projeto

SaiDaDívida é um app de controle de compromissos financeiros mensais (foco em quitar dívidas), tema escuro, com verde-limão neon como cor de ação. Stack: Next.js App Router + TypeScript + Tailwind + Supabase, testes em Vitest.

**Telas existentes (não criar novas):** Início, Histórico, Analytics, Tarefas. Sidebar lateral fixa com bloco secundário (Ver Tutorial, Telegram Bot, Modo Claro, Notificações, Sair).

**Não existe e não deve existir:** conexão bancária, abas horizontais tipo "Lançamentos/Relatórios", tema claro como padrão (Modo Claro é um toggle, não a base).

---

## Escopo desta refatoração

SOMENTE front-end: organização visual, componentes, consistência. A inspiração é o app Organizze, mas **apenas nos padrões de organização** (modal, chips, ícones por categoria, botão de confirmação circular) — a paleta escura atual é mantida.

**Fora de escopo (não tocar):** lógica de projeção/parcelamento, queries Supabase, cálculo de progresso, autenticação, rotas, schema de dados.

---

## 1. Design tokens (Fase 1 — fonte da verdade)

Centralizar em `app/globals.css` (CSS variables) + expor no `tailwind.config.ts`. Auditar o código atual e substituir cores hardcoded por estes tokens:

```css
:root {
  /* superfícies */
  --sdd-bg: #0B0D0B;            /* fundo de página */
  --sdd-surface: #151815;       /* cards, modais */
  --sdd-surface-2: #1E221E;     /* elementos elevados (hover, círculos de ação) */
  --sdd-border: #2A2E2A;        /* hairline padrão */

  /* texto */
  --sdd-text: #F2F4F0;
  --sdd-text-muted: #8A918A;

  /* ação / marca */
  --sdd-accent: #A3E635;        /* verde neon: CTA, ativo, progresso */
  --sdd-on-accent: #16200A;     /* texto sobre o verde neon */

  /* semânticas */
  --sdd-positive: #4ADE80;      /* renda, pago, saldo positivo */
  --sdd-negative: #F87171;      /* saldo negativo, vencido, comprometido */
  --sdd-warning: #FB923C;       /* alertas, KPI comprometido */
}
```

> Ajustar os hex conforme o que já existe no código — a regra é **um token por papel**, não inventar tons novos. Se o app já tem `#B8E62E` como verde, use esse valor no token e pronto.

**Tailwind:** expor como `colors: { sdd: { bg, surface, ... } }` para uso via `bg-sdd-surface`, `text-sdd-accent`, etc.

---

## 2. Mapeamento de categorias (cor + ícone)

Criar `lib/categories.ts` como fonte única — badges da tabela, chips do modal, gráfico de gastos por categoria e histórico devem consumir daqui:

```ts
import { CreditCard, Home, UtensilsCrossed, Wrench, MoreHorizontal } from "lucide-react";

export const CATEGORIES = {
  dividas:     { label: "Dívidas",     icon: CreditCard,       color: "#F87171", bg: "#3A1518" },
  moradia:     { label: "Moradia",     icon: Home,             color: "#85B7EB", bg: "#10161D" },
  alimentacao: { label: "Alimentação", icon: UtensilsCrossed,  color: "#F0997B", bg: "#241512" },
  servicos:    { label: "Serviços",    icon: Wrench,           color: "#5DCAA5", bg: "#12171A" },
  outros:      { label: "Outros",      icon: MoreHorizontal,   color: "#B4B2A9", bg: "#171717" },
} as const;

export type CategoryKey = keyof typeof CATEGORIES;
```

> Completar com as categorias reais do banco. Regra: `color` no texto/ícone/borda, `bg` no fundo do badge — nunca texto branco puro sobre fundo colorido.

---

## 3. Sistema de botões (3 níveis, sem exceção)

| Nível | Uso | Estilo |
|---|---|---|
| **Primário** | 1 por tela ("+ Novo Item", "+ Nova Tarefa", check do modal) | fundo `--sdd-accent`, texto `--sdd-on-accent`; no modal, versão circular 56px com ícone check |
| **Secundário** | ações de card ("Dash", filtros) | fundo transparente, borda `--sdd-border`, hover `--sdd-surface-2` |
| **Ghost/ícone** | editar, excluir, expandir | só ícone `--sdd-text-muted`, hover clareia + fundo `--sdd-surface-2` |

Componente único `<Button variant="primary|secondary|ghost">` — eliminar botões estilizados inline.

---

## 4. Padrões herdados do Organizze (adaptados ao dark)

1. **Modal:** raio 16px, título + X, campos com label pequena acima, foco = borda `--sdd-accent`.
2. **Confirmação circular:** círculo verde neon com check centralizado no rodapé do modal — substitui o botão retangular "Salvar".
3. **Chips de categoria:** pill com ícone + label; selecionada ganha borda e fundo da categoria, com X para remover.
4. **Ações secundárias do modal:** círculos 44px (`--sdd-surface-2`) com ícone + label 11px abaixo (Repetir, Observação, Tags — conforme campos reais do formulário).
5. **Badges de categoria em listas:** mesma pill dos chips, versão compacta, consumindo `CATEGORIES`.

Referência visual do resultado: ver mockup aprovado na conversa (modal "Novo item").

---

## 5. Regras de conduta para a sessão

1. Uma fase por vez; parar e resumir arquivos alterados ao final de cada uma.
2. Refatorar componentes existentes; só criar componente novo se o atual não suportar o padrão (ex: `<Button>`, `<CategoryBadge>` unificados).
3. Nunca alterar arquivos de lógica/dados. Se uma mudança visual exigir mexer em lógica, parar e perguntar.
4. Rodar `vitest` ao final de cada fase; se quebrar, reverter e reportar.
5. Commits no padrão: `refactor(ui): fase N — descrição curta`.
6. Não copiar assets, ícones ou textos do Organizze — apenas os padrões de organização descritos acima.
7. Acessibilidade mínima: contraste AA nos textos sobre cores, `aria-label` em botões só-ícone, foco visível.
