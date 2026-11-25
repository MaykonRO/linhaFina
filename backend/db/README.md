# Migração para o MVP

O script `migration/V1__simplificar_mvp.sql` reduz o banco para `usuarios`, `clientes` e `ordens_servico`, preservando os registros existentes.

Antes de executar:

1. Confirme `backups/pre-mvp-source.zip`, `backups/pre-mvp-local.dump` e `backups/pre-mvp-render.dump`.
2. Execute a migração no banco de desenvolvimento e, separadamente, no banco do Render, usando credenciais locais protegidas.
3. Inicie o backend simplificado e valide login e CRUD. O novo modelo deve encontrar o esquema MVP antes de ser usado.

O script **não é executado automaticamente pelo Spring Boot**. Isso evita remoções acidentais de tabelas durante a inicialização. Testes usam `create-drop` em `linhafina_test` e criam somente o esquema MVP.
