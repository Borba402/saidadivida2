-- Adiciona suporte a renda principal recorrente na tabela de compromissos
ALTER TABLE compromissos
ADD COLUMN IF NOT EXISTS renda_recorrente BOOLEAN NOT NULL DEFAULT false;
