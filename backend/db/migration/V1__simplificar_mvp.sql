-- Simplificacao do Linha Fina para o MVP.
-- Execute somente apos confirmar os backups pre-mvp-source.zip, pre-mvp-local.dump e pre-mvp-render.dump.
-- Este script preserva IDs, codigos, clientes e ordens de servico existentes.

BEGIN;

-- Cliente deixa de usar heranca e passa a guardar os dados necessarios.
ALTER TABLE clientes
    ADD COLUMN IF NOT EXISTS nome varchar(120),
    ADD COLUMN IF NOT EXISTS telefone varchar(20),
    ADD COLUMN IF NOT EXISTS email varchar(160),
    ADD COLUMN IF NOT EXISTS criado_em timestamp without time zone;

UPDATE clientes AS c
SET nome = p.nome,
    telefone = p.telefone,
    email = p.email,
    criado_em = p.criado_em
FROM pessoas AS p
WHERE p.id = c.id;

ALTER TABLE clientes ALTER COLUMN nome SET NOT NULL;
ALTER TABLE clientes ALTER COLUMN criado_em SET NOT NULL;
ALTER TABLE clientes DROP COLUMN IF EXISTS cidade;
ALTER TABLE clientes DROP COLUMN IF EXISTS observacoes;

-- Remove vinculos de OS com tabelas que nao fazem parte do MVP.
DO $$
DECLARE
    constraint_record RECORD;
BEGIN
    FOR constraint_record IN
        SELECT conname, conrelid::regclass AS tabela
        FROM pg_constraint
        WHERE confrelid IN ('servicos'::regclass, 'funcionarias'::regclass)
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I',
                       constraint_record.tabela,
                       constraint_record.conname);
    END LOOP;
END $$;

-- Mantem somente os campos necessarios da OS.
ALTER TABLE ordens_servico
    DROP COLUMN IF EXISTS responsavel_id,
    DROP COLUMN IF EXISTS servico_id,
    DROP COLUMN IF EXISTS tipo_peca,
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
    DROP COLUMN IF EXISTS data_prova,
    DROP COLUMN IF EXISTS data_pronta,
    DROP COLUMN IF EXISTS data_entrega,
    DROP COLUMN IF EXISTS data_pagamento,
    DROP COLUMN IF EXISTS pagamento_status,
    DROP COLUMN IF EXISTS motivo_cancelamento;

ALTER TABLE ordens_servico DROP CONSTRAINT IF EXISTS ordens_servico_status_check;
ALTER TABLE ordens_servico RENAME COLUMN descricao_peca TO descricao_servico;
ALTER TABLE ordens_servico RENAME COLUMN valor_final TO valor;

-- Garante que registros antigos sem previsao continuem validos no MVP.
UPDATE ordens_servico
SET data_prevista_entrega = data_entrada
WHERE data_prevista_entrega IS NULL;

UPDATE ordens_servico
SET status = CASE status
    WHEN 'AGUARDANDO' THEN 'PENDENTE'
    WHEN 'PRODUCAO' THEN 'EM_ANDAMENTO'
    WHEN 'PROVA' THEN 'EM_ANDAMENTO'
    WHEN 'PRONTA' THEN 'EM_ANDAMENTO'
    WHEN 'ENTREGUE' THEN 'CONCLUIDA'
    WHEN 'CANCELADA' THEN 'CANCELADA'
    ELSE 'PENDENTE'
END;

-- Remove tabelas sem utilizacao no MVP. As foreign keys sao removidas em cascata.
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

-- A entidade Cliente usa IDENTITY e precisa de uma sequencia propria apos a heranca.
CREATE SEQUENCE IF NOT EXISTS clientes_id_seq;
SELECT setval('clientes_id_seq', (SELECT COALESCE(MAX(id), 1) FROM clientes));
ALTER TABLE clientes ALTER COLUMN id SET DEFAULT nextval('clientes_id_seq');

COMMIT;
