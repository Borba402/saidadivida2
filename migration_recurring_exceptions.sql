-- ============================================================
-- SaiDaDívida — Fase 18: exclusão por ocorrência em recorrentes
-- Execute no SQL Editor do Supabase (após migration_recurring_bills.sql)
--
-- Problema que isto resolve: materializeRecurringForMonth reinsere todo modelo
-- ativo a cada carregamento do mês. Como não havia vínculo entre o item e o
-- modelo, nem registro de "esta ocorrência foi excluída", apagar um item
-- recorrente durava até o próximo F5.
-- ============================================================

-- ── 1. Vínculo item → modelo ────────────────────────────────
-- Nullable de propósito: item avulso não tem modelo.
-- ON DELETE SET NULL: apagar o modelo não apaga o histórico já materializado,
-- os itens apenas deixam de ser recorrentes.
ALTER TABLE itens_compromisso
  ADD COLUMN IF NOT EXISTS recurring_bill_id UUID
  REFERENCES recurring_bills(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_itens_recurring_bill
  ON itens_compromisso (recurring_bill_id);

-- ── 2. Exceções por ocorrência ──────────────────────────────
-- Uma linha = "não materialize este modelo neste mês".
-- `tipo` já nasce aberto para outros casos (ex.: 'valor_alterado') sem migração.
CREATE TABLE IF NOT EXISTS recurring_exceptions (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  recurring_bill_id UUID REFERENCES recurring_bills(id) ON DELETE CASCADE NOT NULL,
  mes_referencia    TEXT NOT NULL,                 -- 'Julho/2026'
  tipo              TEXT NOT NULL DEFAULT 'excluida',
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (recurring_bill_id, mes_referencia)
);

ALTER TABLE recurring_exceptions ENABLE ROW LEVEL SECURITY;

-- Mesmo padrão das demais tabelas-filhas: dono via tabela pai
DROP POLICY IF EXISTS "recurring_exceptions_user" ON recurring_exceptions;
CREATE POLICY "recurring_exceptions_user" ON recurring_exceptions
  FOR ALL USING (
    recurring_bill_id IN (SELECT id FROM recurring_bills WHERE user_id = auth.uid())
  );

-- ── 3. Consolidar os dois índices únicos redundantes ────────
-- recurring_instance_uniq e idx_itens_unique_compromisso_nome cobrem as mesmas
-- colunas. Fica o segundo: o nome descreve o que a regra realmente faz (nome de
-- item único por compromisso, valendo para QUALQUER item), enquanto o primeiro
-- sugere que só diz respeito a recorrentes — o que nunca foi verdade.
-- O upsert casa por colunas, não por nome de índice, então a materialização
-- continua funcionando.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes
             WHERE tablename = 'itens_compromisso'
               AND indexname = 'idx_itens_unique_compromisso_nome')
  THEN
    DROP INDEX IF EXISTS recurring_instance_uniq;
  ELSE
    RAISE NOTICE 'idx_itens_unique_compromisso_nome não existe — recurring_instance_uniq mantido.';
  END IF;
END $$;

-- Conferência: deve sobrar exatamente UM índice único em (compromisso_id, nome_item)
-- select indexname, indexdef from pg_indexes where tablename = 'itens_compromisso';
