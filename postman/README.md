# Postman — Linha Fina

Arquivos para testar a API Java em `http://localhost:8080/api`.

## Importar

Os dois arquivos estão reunidos em `Documents/LinhaFina-Postman`, fora do Git:

- `Linha_Fina.postman_collection.json`
- `Linha_Fina_Local.postman_environment.json`

1. Abra o Postman desktop.
2. Clique em **Import** e selecione os dois arquivos dessa pasta (ou arraste-os para o Postman).
3. No seletor de ambiente do Postman, escolha **Linha Fina — Local**.

Também é possível importar a coleção versionada nesta pasta `postman/`, mas o ambiente com a senha existe apenas em Documentos.

A senha fica marcada como variável `secret` no ambiente local. O arquivo de exemplo versionado não contém credenciais reais.

## Ordem sugerida

1. `01 Autenticação → Login`.
2. `01 Autenticação → Sessão atual`.
3. `02 Clientes → Criar cliente de teste`.
4. `03 Cadastros de apoio → Criar serviço de teste` e `Criar funcionária de teste`.
5. `04 Ordens de serviço → Calcular previsão` e `Criar OS`.
6. Teste avanço, PDF, pagamentos, relatórios e vitrine.

Os IDs são capturados automaticamente nas respostas e guardados no ambiente. Registros criados manualmente pelo Postman permanecem no PostgreSQL; não use os nomes de teste como dados reais do ateliê. Exclua-os quando apropriado ou deixe o banco apenas com dados verdadeiros.

A vitrine pública não exige login. As demais requisições usam o cookie da sessão criada pelo login.

## Validação executada

Postman desktop 12.37.4 instalado. A pasta `01 Autenticação` foi executada com Newman: login 200, sessão atual 200 e logout 204 — **3 requisições, 3 assertions, 0 falhas**.
