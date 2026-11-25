# Linha Fina — MVP

Sistema simples de gestão para um ateliê de costura, desenvolvido para estudo acadêmico de Java, Spring Boot e PostgreSQL.

## Funcionalidades

- **Login:** autenticação, sessão HttpOnly, proteção das páginas e logout.
- **Clientes:** cadastrar, listar, consultar, editar e excluir clientes quando não houver OS vinculada.
- **Ordens de Serviço:** criar, listar, consultar, editar e excluir OS vinculada a um cliente, com descrição, valor, datas e status.

Status da OS: `pendente`, `em_andamento`, `concluida` e `cancelada`.

Não há módulos de orçamentos, financeiro avançado, pagamentos, relatórios, vitrine, equipe, agenda, folgas, provas, fidelidade ou cálculo automático de capacidade.

## Tecnologias

### Frontend

- HTML5, CSS3 e JavaScript puro com módulos ES.
- Tema escuro violeta e responsividade.
- Sem React, Angular ou Vue.

### Backend

- Java 21.
- Spring Boot 3.5.7.
- Spring Web, Spring Data JPA, Spring Security e Bean Validation.
- Maven.
- PostgreSQL.

## Estrutura

```text
linha fina/
├── front/                 # Interface, páginas e store
├── backend/
│   ├── pom.xml
│   ├── db/
│   │   ├── migration/     # Migração manual para o esquema MVP
│   │   └── README.md
│   └── src/
│       ├── main/java/br/com/linhafina/
│       │   ├── config/
│       │   ├── controller/
│       │   ├── dto/
│       │   ├── exception/
│       │   ├── model/
│       │   ├── repository/
│       │   └── service/
│       └── test/          # Testes do MVP
├── tests/e2e/             # Fluxos do navegador
├── docs/                  # Documentação e esquema PostgreSQL
├── DOCUMENTACAO_JAVA.md
├── RELATORIO_FINAL.md
├── INICIAR.ps1
└── TESTAR.ps1
```

## Pré-requisitos

- JDK 21 LTS.
- Maven 3.9 ou superior.
- PostgreSQL 16 ou superior.
- Node.js 18 ou superior.

## Configuração do PostgreSQL

Crie os bancos de desenvolvimento e testes:

```sql
CREATE ROLE linhafina LOGIN PASSWORD 'troque-por-uma-senha-local';
CREATE DATABASE linhafina OWNER linhafina;
CREATE DATABASE linhafina_test OWNER linhafina;
```

Copie `backend/.env.example` para `backend/.env` e configure as credenciais locais. O arquivo real é ignorado pelo Git.

## Executar

No terminal do backend:

```bash
cd backend
mvn spring-boot:run
```

No terminal do frontend:

```bash
cd front
node server.mjs
```

Acesse `http://localhost:5180` e entre com o administrador configurado em `APP_ADMIN_*`. A API responde em `http://localhost:8080/api`.

No Windows, `INICIAR.ps1` prepara o PostgreSQL e evita duplicar servidores já ativos.

## Testes

```powershell
.\TESTAR.ps1
```

ou:

```bash
cd backend
mvn clean test
```

Com frontend e backend ativos:

```bash
node tests/e2e/mvp.cjs
```

Os testes Java usam `linhafina_test`, separado do desenvolvimento. O E2E cria e remove somente seus próprios registros.

## API

| Recurso | Operações |
|---|---|
| `/api/saude` | GET público para health check |
| `/api/autenticacao/entrar` | POST email/senha |
| `/api/autenticacao/sessao` | GET da sessão atual |
| `/api/autenticacao/sair` | POST para logout |
| `/api/clientes` | GET/POST |
| `/api/clientes/{id}` | GET/PUT/DELETE |
| `/api/ordens-servico` | GET/POST |
| `/api/ordens-servico/{id}` | GET/PUT/DELETE |

## Documentação

- `DOCUMENTACAO_JAVA.md`: explicação das classes e conceitos de POO.
- `RELATORIO_FINAL.md`: estrutura final, remoções e testes.
- `docs/schema-postgresql.sql`: esquema do banco.
- `postman/README.md`: coleção do Postman.
- `RENDER.md`: deploy no Render.
