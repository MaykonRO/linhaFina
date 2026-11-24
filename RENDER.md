# Deploy do Linha Fina no Render

Este projeto possui um Blueprint (`render.yaml`) para criar a API Java, o frontend estático e o PostgreSQL gerenciado no [Render](https://dashboard.render.com/).

## Recursos

| Recurso | Tipo | URL prevista |
|---|---|---|
| `linha-fina-api` | Web Service Docker | `https://linha-fina-api.onrender.com/api` |
| `linha-fina-web` | Static Site | `https://linha-fina-web.onrender.com` |
| `linha-fina-db` | PostgreSQL | Acesso interno pela API |

O `Dockerfile` usa Maven com Java 21 para compilar o backend e uma imagem JRE separada para executar somente o JAR.

## Como publicar

1. Confirme que `render.yaml` e `Dockerfile` estão commitados na branch `main` de `MaykonRO/linhaFina`.
2. No Render Dashboard, conecte sua conta GitHub e escolha **New → Blueprint Instance**.
3. Selecione o repositório `MaykonRO/linhaFina` e a branch `main`.
4. Revise os três recursos e confirme a criação.
5. Aguarde o build da API e a publicação do Static Site.

## Segredos e configuração

- `DB_URL` usa o hostname interno do PostgreSQL do Blueprint; `DB_USERNAME` e `DB_PASSWORD` são lidos via `fromDatabase`.
- `APP_ADMIN_PASSWORD` é gerado automaticamente pelo Render. Consulte-o somente no painel **Environment** da API, sem compartilhá-lo publicamente.
- O e-mail inicial é `admin@linhafina.local`.
- `APP_CORS_ORIGINS` libera o frontend HTTPS do Render.
- `COOKIE_SECURE=true` exige HTTPS para o cookie de sessão.
- Nenhuma senha real está no repositório.

## Validação após o deploy

- API pública: `https://linha-fina-api.onrender.com/api/configuracoes` deve responder JSON.
- Vitrine pública da API: `https://linha-fina-api.onrender.com/api/vitrine/publica` deve responder um array.
- Frontend: `https://linha-fina-web.onrender.com` deve abrir o login.
- Entre com o e-mail inicial e a senha exibida somente no painel da API.
- Cadastre uma cliente e consulte-a para confirmar a persistência no PostgreSQL.

## Observações do plano gratuito

- Serviços gratuitos podem hibernar após inatividade. A primeira requisição após hibernação pode demorar.
- O sistema de arquivos local é temporário. Uploads em `/app/uploads` podem ser perdidos em uma reinicialização/redeploy. Para retenção permanente, configure um disco persistente ou armazenamento de objetos em um ambiente compatível.
- O banco PostgreSQL deve ser criado e mantido pelo Blueprint; não é necessário criar outro banco manualmente.

Documentação oficial usada: [Blueprint YAML Reference](https://render.com/docs/blueprint-spec) e [Static Sites](https://render.com/docs/static-sites).
