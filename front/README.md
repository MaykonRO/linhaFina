# Frontend do Linha Fina — MVP

Interface em HTML, CSS e JavaScript puro, com módulos ES nativos e o tema escuro violeta original.

## Páginas

- `pages/login.html`: entrada e logout.
- `index.html`: boas-vindas e acesso aos módulos.
- `pages/clientes.html`: CRUD de clientes.
- `pages/ordens-servico.html`: listagem, consulta e exclusão de OS.
- `pages/ordem-servico-form.html`: criação e edição de OS.

Não existem páginas de orçamentos, serviços, equipe, vitrine, financeiro, relatórios, configurações ou agenda.

## Executar

```bash
cd front
node server.mjs
```

Acesse `http://localhost:5180` com o backend em `http://localhost:8080/api`.

## Camada de dados

- `js/app/store.js`: clientes, ordens e autenticação.
- `js/app/sessao.js`: sessão HttpOnly.
- `js/services/api/httpClient.js`: Fetch API.
- `js/services/api/index.js`: endpoints de clientes, OS e autenticação.
- `js/config-api.js`: configuração local/produção da API.

Não há mocks nem persistência de negócio no navegador. O único dado local permitido é a preferência visual da sidebar.

## Testes

Com frontend e backend ativos:

```bash
node tests/e2e/mvp.cjs
```

O fluxo testa login, CRUD de clientes, CRUD de OS e responsividade em 390 px e 1440 px, removendo os registros criados.
