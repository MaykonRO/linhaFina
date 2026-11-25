# Deploy do MVP no Render

O Blueprint `render.yaml` mantém três recursos:

- `linha-fina-api`: Web Service Docker com Java 21 e Spring Boot.
- `linha-fina-web`: Static Site com o frontend HTML/CSS/JS.
- `linha-fina-db`: PostgreSQL gerenciado.

## URLs

- Frontend: `https://linha-fina-web.onrender.com`
- API: `https://linha-fina-api.onrender.com/api`

## Variáveis

O Blueprint configura `DB_URL`, usuário e senha do PostgreSQL, `APP_ADMIN_*`, `APP_CORS_ORIGINS`, `COOKIE_SECURE` e `SERVER_SERVLET_SESSION_COOKIE_SAME_SITE`.

- O e-mail administrativo configurado é `linha-fina@gmail.com`.
- A senha fica somente no painel do Render e no `.env` local, nunca no Git.
- `COOKIE_SECURE=true` exige HTTPS.
- `SameSite=None` permite o login entre frontend e API com cookie `Secure`.

## Migração do banco

Antes de publicar o MVP sobre uma base antiga, confirme os backups e execute `backend/db/migration/V1__simplificar_mvp.sql` no banco correspondente. O script remove tabelas fora do MVP e preserva os registros necessários.

## Validação

1. Verifique `https://linha-fina-api.onrender.com/api/saude` retornando `{"status":"ok"}`.
2. Abra `https://linha-fina-web.onrender.com`.
3. Faça login com o administrador configurado.
4. Cadastre uma cliente.
5. Crie uma OS vinculada.
6. Consulte, edite e exclua a OS.
7. Exclua a cliente quando não houver OS vinculada.

## Plano gratuito

Serviços podem hibernar após inatividade. O primeiro acesso pode demorar. O plano gratuito deve ser revisado antes da data de expiração informada no dashboard.

Não há uploads nem módulos avançados no MVP.
