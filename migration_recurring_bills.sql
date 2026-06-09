CREATE TABLE IF NOT EXISTS recurring_bills (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name           TEXT NOT NULL,
  category       TEXT DEFAULT 'Outros',
  default_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  due_day        INTEGER NOT NULL CHECK (due_day BETWEEN 1 AND 31),
  active         BOOLEAN NOT NULL DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Índice único para idempotência na materialização
CREATE UNIQUE INDEX IF NOT EXISTS recurring_instance_uniq
  ON itens_compromisso (compromisso_id, nome_item);

ALTER TABLE recurring_bills ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recurring_bills_user" ON recurring_bills;
CREATE POLICY "recurring_bills_user" ON recurring_bills
  FOR ALL USING (auth.uid() = user_id);
