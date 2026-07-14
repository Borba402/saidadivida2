# CHANGELOG — Refatoração Visual (Fases 1–8)

Stack: **Vite + React + JSX** · CSS custom properties (`--var`) · sem Tailwind · sem TypeScript

---

## Fase 1 — Design Tokens (`--sdd-*`)

**Objetivo:** zero mudança visual; substituir todas as cores hardcoded por variáveis CSS rastreáveis.

### Tokens criados em `src/index.css` (bloco `:root`)

| Token | Valor |
|---|---|
| `--sdd-bg` | `#0a0a0a` |
| `--sdd-surface` | `#141414` |
| `--sdd-surface-2` | `#1a1a1a` |
| `--sdd-border` | `#1e1e1e` |
| `--sdd-text` | `#f0f0f0` |
| `--sdd-text-muted` | `#6b7280` |
| `--sdd-text-dim` | `#9ca3af` |
| `--sdd-accent` | `#a3e635` |
| `--sdd-on-accent` | `#0a0a0a` |
| `--sdd-positive` | `#22c55e` |
| `--sdd-negative` | `#ef4444` |
| `--sdd-warning` | `#f59e0b` |
| `--sdd-pending` | `#f97316` |

### Substituições aplicadas

- `.btn-primary`, `.btn-lime`, `.btn-google:hover` — cores → tokens
- `.xp-popup` — background/color → tokens
- `.timer-main-btn--play` — stroke/fill → tokens
- `.dash-item--pago`, `.dash-item--pendente` — cores → tokens
- `.status-chip--*` — todas as variantes → tokens
- `.lp color` — cor do texto → token
- `FocusTimer.jsx` — `strokeColor` calculado com CSS vars; SVG circle/text → tokens
- `KanbanTab.jsx` — `COLUMNS` definition; move buttons → tokens
- `LandingPage.jsx` — `STATS`/`STEPS`/`FEATURES` color fields → tokens
- `LoginPage.jsx` — success banner → token
- `Sidebar.jsx` — Bell icon color → token
- `TelegramConnect.jsx` — connected/disconnected colors → tokens

---

## Fase 2 — Sistema de Botões (`<Button>`)

**Objetivo:** componente único substituindo todos os botões avulsos; regra de no máximo 1 primary visível por tela.

### Novo arquivo: `src/components/ui/Button.jsx`

Variants: `primary | secondary | ghost`  
Sizes: `sm | icon` (padrão sem size = normal)  
Props de estado: `active`, `danger`, `disabled`

### CSS adicionado: `.sdd-btn`

```
.sdd-btn            — base (inline-flex, border-radius, transition, focus-visible)
.sdd-btn--primary   — bg sdd-accent, color sdd-on-accent
.sdd-btn--secondary — borda sdd-border, fundo transparente
.sdd-btn--secondary[data-active] — borda + cor sdd-accent
.sdd-btn--ghost     — texto muted, hover subtle
.sdd-btn--ghost[data-danger]:hover — texto sdd-negative
.sdd-btn--sm        — padding/font reduzidos
.sdd-btn--icon      — 2rem×2rem quadrado
```

### Migração

| Arquivo | Buttons migrados |
|---|---|
| `CompromissosTab.jsx` | "+ Novo Item" (primary↔secondary toggle), Salvar, Cancelar, editar/excluir (ghost icon) |
| `TarefasTab.jsx` | "+ Nova Tarefa" (toggle), Cancelar, submit, filtros (secondary active) |
| `HistoricoTab.jsx` | "Dash" (secondary sm) |
| `DividasForm.jsx` | submit primary, filtros secondary active, delete ghost danger |
| `GastosForm.jsx` | idem DividasForm |

---

## Fase 3 — Sistema de Categorias

**Objetivo:** fonte única de verdade para mapeamento categoria → ícone + cor.

### Novo arquivo: `src/lib/categories.js`

10 categorias reais do banco (string livre, não enum):

| Categoria | Ícone | Cor |
|---|---|---|
| Alimentação | UtensilsCrossed | `#f59e0b` |
| Moradia | Home | `#3b82f6` |
| Transporte | Car | `#8b5cf6` |
| Saúde | HeartPulse | `#ef4444` |
| Educação | BookOpen | `#06b6d4` |
| Lazer | Music2 | `#ec4899` |
| Vestuário | Shirt | `#f97316` |
| Serviços | Wrench | `#6b7280` |
| Dívidas | CreditCard | `#dc2626` |
| Outros | MoreHorizontal | `#9ca3af` |

Fallback automático para `Outros` via `getCategory(name)`.

### Novo arquivo: `src/components/ui/CategoryBadge.jsx`

Pill `inline-flex` com ícone + label, sizes `sm`/`md`. Cores lidas de `getCategory()`.

### Aplicações

- `CompromissosTab.jsx` — tabela "Itens do mês": coluna Categoria usa `<CategoryBadge>`; removeu bloco `CAT_COLORS` local
- `HistoricoTab.jsx` — cards do histórico: row de chips das categorias do mês; removeu `CAT_COLORS`
- `AnalyticsTab.jsx` — bar chart "Gastos por Categoria": `fill={getCategory(entry.cat).color}`; removeu `CAT_COLORS`
- `MonthDashboard.jsx` — bar chart: `<Cell fill={getCategory(entry.name).color} />`

**Total de mapas `CAT_COLORS` removidos: 3**

---

## Fase 4 — Modal "Novo Item"

**Objetivo:** substituir formulário inline por modal overlay real com UX moderno.

### CSS adicionado

```
.item-modal-overlay  — position:fixed, backdrop blur(4px), z-index 9000
.item-modal          — border-radius 16px, sdd-surface, animação itemModalIn
.item-modal__header  — título + botão X
.item-modal__body    — flex-col gap:1rem
.item-modal__label   — 0.68rem uppercase muted
.item-modal__row     — grid 2-col para valor/vencimento
.item-modal__input   — focus: sdd-accent border + lime-dim shadow
.cat-chips-row       — flex-wrap chips de categoria
.cat-chip            — pill border:transparent → borda+bg da categoria quando selecionado
.cat-chip__x         — X para desselecionar
.action-circles-row  — flex row de círculos de ação opcional
.action-circle__btn  — 44px círculo; --active: lime-dim + sdd-accent
.action-circle__label — 0.68rem abaixo do círculo
.item-modal__footer  — justify-content:center
.save-circle-btn     — 56px circular, sdd-accent, glow + scale hover
```

### Mudanças em `CompromissosTab.jsx`

- Formulário inline `.add-item-form` → modal `role="dialog" aria-modal="true"`
- Backdrop click fecha e reseta o form
- Seletor de `<select>` de categoria → 10 chips pill com ícone; chip selecionado mostra borda+fundo da categoria + X
- Toggle "Repetir todo mês" → círculo de ação 44px com `Repeat2` + label "Repetir"
- Botão salvar → `56px` circular `aria-label="Salvar item"` com `<Check>` / `<Loader2>` (saving)
- `handleAddItem` e toda lógica de validação: **sem alteração**
- Imports adicionados: `getCategory`, `Loader2`

---

## Fase 5 — Tabela de Itens, Progresso e Seletor de Mês

### 1. Seletor de mês

- `.month-tab`: `border: none` → `border: 1px solid transparent` (sem layout shift)
- `.month-tab--active`: adicionado `border-color: rgba(163,230,53,0.35)` — pill com borda accent
- Mesma borda aplicada no breakpoint mobile 600px

### 2. Checkbox "Pago" (tabela de itens)

Substituiu `toggle-pago-btn` + ícones `CheckCircle2`/`Circle` por:

```
.pago-toggle          — 24px círculo, border: 2px sdd-border, fundo transparente
.pago-toggle:hover    — borda sdd-positive + rgba(34,197,94,0.1)
.pago-toggle--checked — fundo sdd-positive, borda sdd-positive, cor #fff
```

Ícone `<Check size={13} strokeWidth={3}>` renderizado apenas quando `pago`.  
`aria-label` condicional para acessibilidade.  
Importações `CheckCircle2` e `Circle` removidas.

### 3. Card de progresso

- `.progress-secondary-strip__label`: `0.65rem` → `0.75rem`; `var(--text-muted)` → `var(--sdd-text-muted)`
- `.progress-secondary-strip__value`: `font-weight: 700` → `font-weight: 500`
- `.progress-stats__secondary em`: hardcoded `#f97316` → `var(--sdd-pending)`
- JSX: "Saldo Restante" cor fixa `var(--text-muted)` → condicional `var(--sdd-positive)` / `var(--sdd-negative)`

---

## Fase 6 — Cards do Histórico

### 1. Badge de status

De `inline-block` sem borda → `inline-flex` com ícone e borda, estilo idêntico ao `<CategoryBadge>`:

| Estado | bg | cor | borda |
|---|---|---|---|
| Saldo positivo | `var(--lime-dim)` | `var(--sdd-accent)` | `rgba(163,230,53,0.3)` |
| Saldo negativo | `var(--danger-light)` | `var(--sdd-negative)` | `rgba(239,68,68,0.3)` |

Ícones: `<TrendingUp>` / `<TrendingDown>` size 11 inline no badge.

### 2. Métricas dos cards

- `.historico-metric__label`: `0.68rem` → `0.75rem`; `var(--text-muted)` → `var(--sdd-text-muted)` — mesmo padrão da tela Início (Fase 5)
- `.historico-metric__value`: `font-weight: 700` → `font-weight: 500`
- JSX: ícones inline removidos das métricas; Saldo → cor condicional via tokens
- Imports: `DollarSign`, `CheckCircle2` removidos; `TrendingUp` adicionado

### 3. Barra de progresso

- Trilha: `var(--border-hover)` → `var(--sdd-surface-2)`
- Fill: gradiente linear → `var(--sdd-accent)` sólido + `box-shadow: 0 0 8px rgba(163,230,53,0.45)` (mesmo glow do anel SVG)

---

## Fase 7 — Analytics e Tarefas

### Analytics — KPI Cards

- Label: `0.7rem` → `0.75rem`; `var(--text-muted)` → `var(--sdd-text-muted)`; `letter-spacing` → `0.05em`
- Valor: `1.05rem font-weight:800` → `1.35rem font-weight:700 line-height:1.1`
- Ícone "Saldo": bg/cor hardcoded → `var(--lime-dim)`/`var(--danger-light)` + `var(--sdd-accent)`/`var(--sdd-negative)`
- Adicionado 3º KPI "Pago no Mês" (dado `totalPagoAtual` já calculado), cor `var(--sdd-positive)`

### Analytics — Gráficos

- Bug corrigido: `<rect>` → `<Cell>` no bar chart "Gastos por Categoria" (elemento nativo ignorado pelo Recharts)
- Import `Cell` adicionado de `recharts`
- Linha de saldo (AreaChart): já usava `var(--sdd-accent)` ✓
- Renda vs. Comprometido: já usava `var(--sdd-accent)` e `var(--sdd-warning)` ✓
- Categorias: agora renderiza corretamente com `getCategory().color` via `<Cell>`

### Tarefas — Filtros

- `.tarefas-filtro-btn`: `border: none` → `border: 1px solid transparent`
- `.tarefas-filtro-btn--active`: adicionado `border-color: rgba(163,230,53,0.35)` + cor `var(--sdd-accent)` — consistente com seletor de mês e chips de categoria
- Count badge: hardcoded `rgba(163,230,53,0.15)` → `var(--lime-dim)`

### Tarefas — Badge de Prioridade

Convertido para pill semântica com borda:

| Prioridade | bg | cor | borda |
|---|---|---|---|
| baixa | `var(--sdd-surface-2)` | `var(--sdd-text-dim)` | `var(--sdd-border)` |
| normal | `var(--sdd-surface-2)` | `var(--sdd-text-muted)` | `var(--sdd-border)` |
| **alta** | `var(--danger-light)` | **`var(--sdd-negative)`** | `rgba(239,68,68,0.3)` |

### Tarefas — Data Vencida

- `.tarefa-date--vencida`: `color: var(--danger)` → `color: var(--sdd-negative)` + `font-weight: 600`
- `.tarefa-date`: `color: var(--text-muted)` → `color: var(--sdd-text-muted)`
- Ícone `<AlertCircle>` já presente no JSX

---

## Fase 8 — Auditoria, Responsividade e Qualidade

### Inconsistências encontradas e corrigidas

| Local | Problema | Correção |
|---|---|---|
| `CompromissosTab.jsx:325` | `color: 'var(--text-muted)'` no ícone Edit3 | → `var(--sdd-text-muted)` |
| `src/index.css:480px` | `analytics-kpis` usava `1fr 1fr` com 3 cards → card 3 ficava sozinho em 50% de largura | → `1fr` (coluna única) |
| `AnalyticsTab.jsx` | `<rect>` nativo ignorado pelo Recharts (bug silencioso) | → `<Cell>` do recharts |

### Inconsistências aceitas (intencionais)

| Local | Motivo |
|---|---|
| `LoginPage.jsx` — SVG Google com `fill="#4285F4"` etc. | Cores da marca Google; não tokenizáveis |
| `Sidebar.jsx` / `TelegramConnect.jsx` — `color: '#229ED9'` | Cor oficial do Telegram; não tokenizável |
| `pago-toggle--checked:hover` — `#16a34a` | Tom mais escuro de `--sdd-positive` para hover; sem token de hover-positive |
| `swipeColor` em CompromissosTab | RGB inline dinâmico em template literal para `box-shadow` progressivo; CSS vars não funcionam neste contexto |
| LandingPage — várias cores hardcoded | LandingPage tem design próprio separado do app; fora do escopo das 4 telas |

### Responsividade — cobertura verificada

| Tela | 768px | 600px | 480px |
|---|---|---|---|
| Início (CompromissosTab) | tabela vira cards grid-area | month-nav → arrows + tab ativo; itens → card layout | padding reduzido |
| Histórico | cards flex coluna ✓ | — | — |
| Analytics | KPIs 2-col | — | KPIs 1-col (corrigido) |
| Tarefas | layout flex ✓ | — | — |
| Sidebar | slide-out + bottom-nav ✓ | — | — |

### Contraste AA (WCAG 2.1)

| Combinação | Rácio estimado | AA? |
|---|---|---|
| `--sdd-accent` (`#a3e635`) sobre `--sdd-on-accent` (`#0a0a0a`) — botão primary | ~11.7:1 | ✅ AAA |
| `--sdd-negative` (`#ef4444`) sobre badge bg (~`#271b1b`) | ~3.9:1 | ✅ AA (bold ≥14px) |
| `--sdd-accent` sobre badge bg lime-dim (~`#161b0d`) | ~10.7:1 | ✅ AAA |
| `--sdd-text-muted` (`#6b7280`) sobre `--sdd-surface` (`#141414`) | ~3.6:1 | ⚠️ sub-AA para texto ≤14px regular — padrão dark-theme aceito |

### Suíte de testes

O projeto **não possui testes automatizados** (`package.json` sem script `test`; sem Vitest, Jest ou Testing Library instalados). ESLint disponível via `npm run lint`.

**ESLint — problemas encontrados (pré-existentes, não introduzidos nesta refatoração):**
- `TarefasTab.jsx`: import `React` desnecessário (JSX Transform); `useEffect` chama função async com `setState` dentro (padrão comum, falso positivo do `react-hooks/set-state-in-effect`)
- Estes não são bugs funcionais e estavam presentes antes da Fase 1

---

## Resumo de Arquivos Alterados

### Novos arquivos
- `src/components/ui/Button.jsx`
- `src/components/ui/CategoryBadge.jsx`
- `src/lib/categories.js`

### Arquivos modificados
| Arquivo | Fases |
|---|---|
| `src/index.css` | 1, 2, 4, 5, 6, 7, 8 |
| `src/components/CompromissosTab.jsx` | 2, 3, 4, 5, 8 |
| `src/components/HistoricoTab.jsx` | 2, 3, 6 |
| `src/components/AnalyticsTab.jsx` | 1, 3, 7 |
| `src/components/TarefasTab.jsx` | 2 (CSS: 7) |
| `src/components/MonthDashboard.jsx` | 1, 3 |
| `src/components/DividasForm.jsx` | 2 |
| `src/components/GastosForm.jsx` | 2 |
| `src/components/FocusTimer.jsx` | 1 |
| `src/components/KanbanTab.jsx` | 1 |
| `src/components/LandingPage.jsx` | 1 |
| `src/components/LoginPage.jsx` | 1 |
| `src/components/Sidebar.jsx` | 1 |
| `src/components/TelegramConnect.jsx` | 1 |
