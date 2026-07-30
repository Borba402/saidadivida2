-- ============================================================
-- Fase 18 — Backfill de recurring_bill_id nos itens já existentes
--
-- NÃO RODE DIRETO. Execute os passos 1 e 2 primeiro e confira a saída.
-- Rode só depois de migration_recurring_exceptions.sql.
--
-- A correspondência possível é por (user_id + nome_item), porque é exatamente
-- assim que a materialização vinha criando os itens. É uma heurística: um item
-- avulso batizado igual a um modelo será adotado como recorrente. O passo 2
-- mostra linha a linha o que seria alterado.
-- ============================================================

-- ── Passo 1: há ambiguidade? ────────────────────────────────
-- Se retornar QUALQUER linha, existe mais de um modelo ativo com o mesmo nome
-- para o mesmo usuário: o backfill escolheria arbitrariamente. Resolva antes.
SELECT user_id, name, COUNT(*) AS modelos_ativos
FROM recurring_bills
WHERE active
GROUP BY user_id, name
HAVING COUNT(*) > 1;

-- ── Passo 2: prévia — o que exatamente seria vinculado ──────
SELECT i.id            AS item_id,
       i.nome_item,
       c.mes_referencia,
       c.user_id,
       rb.id           AS recurring_bill_id,
       i.created_at
FROM itens_compromisso i
JOIN compromissos c    ON c.id = i.compromisso_id
JOIN recurring_bills rb ON rb.user_id = c.user_id
                       AND rb.name = i.nome_item
                       AND rb.active
WHERE i.recurring_bill_id IS NULL
ORDER BY c.user_id, i.nome_item, i.created_at;

-- ── Passo 3: aplicar (só depois de conferir os passos 1 e 2) ─
-- UPDATE itens_compromisso i
-- SET recurring_bill_id = rb.id
-- FROM compromissos c, recurring_bills rb
-- WHERE i.compromisso_id = c.id
--   AND rb.user_id = c.user_id
--   AND rb.name = i.nome_item
--   AND rb.active
--   AND i.recurring_bill_id IS NULL;

-- ── Passo 4: conferir o resultado ───────────────────────────
-- SELECT COUNT(*) FILTER (WHERE recurring_bill_id IS NOT NULL) AS vinculados,
--        COUNT(*) FILTER (WHERE recurring_bill_id IS NULL)     AS avulsos
-- FROM itens_compromisso;
