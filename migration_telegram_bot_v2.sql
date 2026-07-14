-- ============================================================
-- SaiDaDívida — Fase 12 Parte B: RPCs do bot Telegram
-- Execute no SQL Editor do Supabase (após schema_v2.sql)
-- ============================================================

-- ── Tabela de item pendente de confirmação (fluxo inline do bot) ──
-- Uma linha por chat: o bot guarda aqui o que foi parseado da
-- mensagem até o usuário confirmar, trocar categoria ou cancelar.
CREATE TABLE IF NOT EXISTS telegram_pending_items (
  chat_id         TEXT PRIMARY KEY,
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  mes_referencia  TEXT NOT NULL,
  nome_item       TEXT NOT NULL,
  valor           DECIMAL(10,2) NOT NULL,
  categoria       TEXT NOT NULL DEFAULT 'Outros',
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE telegram_pending_items ENABLE ROW LEVEL SECURITY;

-- Só o service role (webhook na Vercel) acessa esta tabela
DROP POLICY IF EXISTS "telegram_pending_service" ON telegram_pending_items;
CREATE POLICY "telegram_pending_service" ON telegram_pending_items
  FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- RPC: registrar_item
-- Cria (ou reaproveita) o compromisso do mês e insere o item.
-- SECURITY DEFINER para poder ser chamada tanto pelo service role
-- do bot quanto, futuramente, por um usuário autenticado direto
-- do app sem depender de duas idas ao banco (get-or-create + insert).
-- ============================================================
CREATE OR REPLACE FUNCTION registrar_item(
  p_user_id         UUID,
  p_mes_referencia  TEXT,
  p_nome_item       TEXT,
  p_valor           NUMERIC,
  p_categoria       TEXT DEFAULT 'Outros',
  p_data_vencimento DATE DEFAULT NULL
)
RETURNS itens_compromisso
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_compromisso_id UUID;
  v_item itens_compromisso;
BEGIN
  SELECT id INTO v_compromisso_id
  FROM compromissos
  WHERE user_id = p_user_id AND mes_referencia = p_mes_referencia;

  IF v_compromisso_id IS NULL THEN
    INSERT INTO compromissos (user_id, mes_referencia, renda_mensal)
    VALUES (p_user_id, p_mes_referencia, 0)
    RETURNING id INTO v_compromisso_id;
  END IF;

  INSERT INTO itens_compromisso (compromisso_id, nome_item, valor, categoria, data_vencimento, pago)
  VALUES (v_compromisso_id, p_nome_item, p_valor, COALESCE(p_categoria, 'Outros'), p_data_vencimento, FALSE)
  RETURNING * INTO v_item;

  RETURN v_item;
END;
$$;

GRANT EXECUTE ON FUNCTION registrar_item(UUID, TEXT, TEXT, NUMERIC, TEXT, DATE) TO authenticated, service_role;

-- ============================================================
-- RPC: resumo_mes
-- Resumo financeiro do mês, incluindo rendas extras (JOIN por
-- compromisso_id). Fórmula idêntica à do CompromissosTab:
--   saldo = (renda_mensal + total_extras) - total_gastos
-- ============================================================
CREATE OR REPLACE FUNCTION resumo_mes(
  p_user_id        UUID,
  p_mes_referencia TEXT
)
RETURNS TABLE (
  renda_mensal          NUMERIC,
  total_extras          NUMERIC,
  total_renda           NUMERIC,
  total_gastos          NUMERIC,
  total_pago            NUMERIC,
  saldo                 NUMERIC,
  falta_pagar           NUMERIC,
  pct                   NUMERIC,
  proximos_vencimentos  JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_compromisso_id UUID;
  v_renda_mensal   NUMERIC := 0;
  v_total_extras   NUMERIC := 0;
  v_total_gastos   NUMERIC := 0;
  v_total_pago     NUMERIC := 0;
BEGIN
  SELECT c.id, COALESCE(c.renda_mensal, 0)
    INTO v_compromisso_id, v_renda_mensal
  FROM compromissos c
  WHERE c.user_id = p_user_id AND c.mes_referencia = p_mes_referencia;

  IF v_compromisso_id IS NULL THEN
    RETURN QUERY SELECT
      0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
      0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
      '[]'::JSONB;
    RETURN;
  END IF;

  SELECT COALESCE(SUM(r.valor), 0) INTO v_total_extras
  FROM rendas_extra r
  WHERE r.compromisso_id = v_compromisso_id;

  SELECT COALESCE(SUM(i.valor), 0), COALESCE(SUM(i.valor) FILTER (WHERE i.pago), 0)
    INTO v_total_gastos, v_total_pago
  FROM itens_compromisso i
  WHERE i.compromisso_id = v_compromisso_id;

  RETURN QUERY
  SELECT
    v_renda_mensal,
    v_total_extras,
    v_renda_mensal + v_total_extras AS total_renda,
    v_total_gastos,
    v_total_pago,
    (v_renda_mensal + v_total_extras) - v_total_gastos AS saldo,
    v_total_gastos - v_total_pago AS falta_pagar,
    CASE WHEN v_total_gastos > 0 THEN ROUND((v_total_pago / v_total_gastos) * 100) ELSE 0 END AS pct,
    COALESCE((
      SELECT JSONB_AGG(JSONB_BUILD_OBJECT(
        'nome_item', sub.nome_item,
        'valor', sub.valor,
        'data_vencimento', sub.data_vencimento
      ))
      FROM (
        SELECT nome_item, valor, data_vencimento
        FROM itens_compromisso
        WHERE compromisso_id = v_compromisso_id AND pago = FALSE
        ORDER BY data_vencimento ASC NULLS LAST
        LIMIT 3
      ) sub
    ), '[]'::JSONB) AS proximos_vencimentos;
END;
$$;

GRANT EXECUTE ON FUNCTION resumo_mes(UUID, TEXT) TO authenticated, service_role;
