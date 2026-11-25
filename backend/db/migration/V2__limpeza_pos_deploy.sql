-- Limpeza idempotente apos a transicao para o MVP.
-- Necessaria se uma versao antiga da aplicacao for reiniciada durante a migracao.

BEGIN;

ALTER TABLE clientes DROP CONSTRAINT IF EXISTS fk4v6f2rdxo2a8qkd2undidx0ec;
ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS ordens_servico_status_check;
DROP TABLE IF EXISTS pagamentos CASCADE;
DROP TABLE IF EXISTS orcamentos CASCADE;
DROP TABLE IF EXISTS pecas_vitrine CASCADE;
DROP TABLE IF EXISTS dias_de_folga CASCADE;
DROP TABLE IF EXISTS horarios_atendimento CASCADE;
DROP TABLE IF EXISTS configuracoes CASCADE;
DROP TABLE IF EXISTS fichas_medidas CASCADE;
DROP TABLE IF EXISTS funcionarias CASCADE;
DROP TABLE IF EXISTS servicos CASCADE;
DROP TABLE IF EXISTS pessoas CASCADE;
ALTER TABLE clientes DROP COLUMN IF EXISTS cidade;
ALTER TABLE clientes DROP COLUMN IF EXISTS observacoes;

ALTER TABLE ordens_servico
    DROP COLUMN IF EXISTS responsavel_id,
    DROP COLUMN IF EXISTS servico_id,
    DROP COLUMN IF EXISTS tipo_peca,
    DROP COLUMN IF EXISTS descricao_peca,
    DROP COLUMN IF EXISTS observacoes,
    DROP COLUMN IF EXISTS sob_medida,
    DROP COLUMN IF EXISTS ajuste,
    DROP COLUMN IF EXISTS urgente,
    DROP COLUMN IF EXISTS prova_comparecida,
    DROP COLUMN IF EXISTS valor_servico,
    DROP COLUMN IF EXISTS taxa_urgencia,
    DROP COLUMN IF EXISTS taxa_guarda,
    DROP COLUMN IF EXISTS desconto,
    DROP COLUMN IF EXISTS valor_pago,
    DROP COLUMN IF EXISTS valor_final,
    DROP COLUMN IF EXISTS data_prova,
    DROP COLUMN IF EXISTS data_pronta,
    DROP COLUMN IF EXISTS data_entrega,
    DROP COLUMN IF EXISTS data_pagamento,
    DROP COLUMN IF EXISTS pagamento_status,
    DROP COLUMN IF EXISTS motivo_cancelamento;

DROP SEQUENCE IF EXISTS orcamento_seq;

CREATE SEQUENCE IF NOT EXISTS clientes_id_seq;
SELECT setval('clientes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM clientes));
ALTER TABLE clientes ALTER COLUMN id SET DEFAULT nextval('clientes_id_seq');

COMMIT;
