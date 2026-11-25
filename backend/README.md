# Backend do Linha Fina — MVP

API REST acadêmica com Java 21, Spring Boot, Spring Data JPA, Spring Security e PostgreSQL.

## Módulos

- `AutenticacaoController` e `AutenticacaoService`: login, sessão e logout.
- `ClienteController` e `ClienteService`: CRUD de clientes.
- `OrdemServicoController` e `OrdemServicoService`: CRUD de ordens de serviço.

Entidades de negócio: `Usuario`, `Cliente` e `OrdemServico`. `Pessoa` é uma classe abstrata herdada por `Usuario` e `Cliente` com `@MappedSuperclass`, sem tabela extra. `Papel` e `StatusOrdem` são enums de apoio.

## Pacotes

```text
config/       segurança, CORS e administrador inicial
controller/   rotas REST
service/      validações e regras de negócio
repository/   interfaces Spring Data JPA
model/        entidades e enums
dto/          entrada e saída JSON
exception/    respostas de erro padronizadas
```

## Configuração

Copie `.env.example` para `.env` e informe:

```properties
DB_URL=jdbc:postgresql://localhost:5432/linhafina
DB_USERNAME=linhafina
DB_PASSWORD=troque-pela-senha-local
APP_ADMIN_EMAIL=linha-fina@gmail.com
APP_ADMIN_PASSWORD=troque-pela-senha-administrativa
APP_ADMIN_NAME=Administracao Local
```

Não commite `.env`. O administrador inicial só é criado se a tabela estiver vazia e as variáveis estiverem configuradas.

## Executar e testar

```bash
mvn spring-boot:run
mvn clean test
```

A API usa `http://localhost:8080/api`. Testes usam `linhafina_test`, sem H2.

## Endpoints

| Recurso | Operações |
|---|---|
| `/api/saude` e `/api/configuracoes` | GET público para health check |
| `/api/autenticacao/entrar` | POST |
| `/api/autenticacao/sessao` | GET |
| `/api/autenticacao/sair` | POST |
| `/api/clientes` | GET/POST |
| `/api/clientes/{id}` | GET/PUT/DELETE |
| `/api/ordens-servico` | GET/POST |
| `/api/ordens-servico/{id}` | GET/PUT/DELETE |

Cliente só pode ser excluída quando não possuir OS vinculada. A OS exige cliente existente, descrição, valor positivo e previsão maior ou igual à entrada.
