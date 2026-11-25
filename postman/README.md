# Postman — MVP do Linha Fina

A coleção contém apenas autenticação, clientes e ordens de serviço.

## Importar

Os arquivos estão em `Documents/LinhaFina-Postman`, fora do Git:

- `Linha_Fina.postman_collection.json`
- `Linha_Fina_Local.postman_environment.json`

Abra o Postman, clique em **Import**, selecione os dois arquivos e escolha o ambiente **Linha Fina — Local**.

## Ordem sugerida

1. `Autenticação → Login`.
2. `Autenticação → Sessão atual`.
3. `Clientes → Criar cliente de teste`.
4. `Ordens de Serviço → Criar OS`.
5. Consulte, edite e exclua a OS.
6. Exclua a cliente somente depois de excluir a OS.

Os IDs são capturados nas respostas e guardados no ambiente. Registros criados manualmente permanecem no PostgreSQL; remova-os quando apropriado.

O login usa cookie de sessão, sem Bearer Token.
