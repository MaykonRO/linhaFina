# Linha Fina — backend Java

API REST acadêmica do Linha Fina. O backend utiliza Java 21, Spring Boot, Spring Data JPA/Hibernate, Bean Validation, Maven e PostgreSQL. Não usa Lombok, MapStruct nem H2.

## Arquitetura

```text
Navegador → Controller → Service → Repository → PostgreSQL
                         ↓
                       DTOs
```

- `controller`: rotas HTTP e códigos de resposta.
- `service`: validações e regras de negócio/transações.
- `repository`: interfaces Spring Data para consultas e persistência.
- `model`: entidades, associações, enums e herança.
- `dto`: objetos de entrada/saída compatíveis com o frontend.
- `config`: CORS do frontend local.
- `exception`: respostas JSON padronizadas de erro.

## Herança

`Pessoa` é abstrata e concentra `id`, `nome`, `telefone`, `email` e `criadoEm`. `Cliente` e `Funcionaria` usam `extends Pessoa`, chamam `super(...)` e sobrescrevem `getTipoPessoa()`.

A estratégia JPA é `JOINED`: a tabela `pessoas` contém os dados comuns; `clientes` e `funcionarias` compartilham a mesma chave primária da pessoa e guardam apenas os atributos específicos. Essa escolha evita repetir colunas e deixa a herança visível no banco.

## Configuração local

1. Copie `.env.example` para `.env`.
2. Informe a senha do PostgreSQL local. **Não commite `.env`.**
3. Crie os bancos `linhafina` e `linhafina_test`.

```properties
DB_URL=jdbc:postgresql://localhost:5432/linhafina
DB_USERNAME=linhafina
DB_PASSWORD=sua-senha-local
ATELIE_CAPACIDADE_HORAS_DIA=8
ATELIE_TAXA_URGENCIA_PADRAO=20
```

`src/main/resources/application.properties` lê esse arquivo somente se ele existir. Também é possível usar variáveis de ambiente do sistema. Não há credencial no código versionado.

## Autenticação local

Configure `APP_ADMIN_EMAIL`, `APP_ADMIN_PASSWORD` e, opcionalmente, `APP_ADMIN_NAME` no `.env`. Na primeira inicialização, somente se a tabela de usuários estiver vazia, o backend cria esse administrador com senha BCrypt. Não existe usuário/senha fixa no código.

A sessão usa cookie HttpOnly. O frontend consulta `/api/autenticacao/sessao` a cada documento e não grava identidade ou senha no `localStorage`. `DONO` e `ADMIN` podem excluir registros e alterar configurações; os demais papéis possuem acesso autenticado sem essas permissões administrativas.

CSRF está desabilitado apenas para simplificar este ambiente local didático. Em produção, deve-se habilitar CSRF, cookie `Secure`, HTTPS e uma política completa de autorização por recurso.

## Executar

Com JDK 21 e Maven 3.9+ disponíveis:

```bash
cd backend
mvn spring-boot:run
```

API: `http://localhost:8080/api`.

Para gerar e executar o artefato completo:

```bash
mvn clean package
java -jar target/linha-fina-1.0.0.jar
```

O JAR utiliza o mesmo `backend/.env` quando iniciado a partir da pasta `backend/`.

Frontend:

```bash
cd front
node server.mjs
```

Interface: `http://localhost:5180`.

## Testar

```bash
cd backend
mvn test
```

Os testes de integração usam PostgreSQL real em `linhafina_test`, com `create-drop`; não usam o banco de desenvolvimento nem H2. O teste E2E do núcleo está em `../tests/e2e/nucleo.cjs` e exige frontend e backend em execução.

```bash
node tests/e2e/nucleo.cjs
```

O E2E cria registros pelos formulários e remove somente esses registros ao final.

## Endpoints da API

| Recurso | Operações |
|---|---|
| `/api/clientes` | GET/POST; `/{id}` GET/PUT/DELETE; PUT aceita ficha de medidas parcial |
| `/api/servicos` | GET/POST; `/{id}` GET/PUT/DELETE; `/{id}/situacao` PATCH |
| `/api/funcionarias` | GET/POST; `/{id}` PUT/DELETE |
| `/api/ordens-servico` | GET/POST; `/{id}` GET/PUT |
| `/api/ordens-servico/previsao` | POST: calcula fila, horas, dias úteis e impactos sem salvar |
| `/api/ordens-servico/{id}/avancar-status` | POST |
| `/api/ordens-servico/{id}/cancelar` | POST com motivo |
| `/api/ordens-servico/{id}/prova` | POST com comparecimento ou nova data; recalcula após falta |
| `/api/ordens-servico/{id}/pagamento` | POST com situação e valor |
| `/api/pagamentos` | GET das baixas; `/{id}` POST usando a mesma regra da OS |
| `/api/configuracoes` | GET/PUT com merge por seção |
| `/api/autenticacao/entrar` | POST com email/senha; cria sessão HttpOnly |
| `/api/autenticacao/sessao` | GET da identidade atual |
| `/api/autenticacao/sair` | POST para encerrar a sessão |
| `/api/orcamentos` | GET/POST; `/{id}` GET/PUT |
| `/api/orcamentos/{id}/aprovar` | POST |
| `/api/orcamentos/{id}/recusar` | POST com motivo opcional |
| `/api/orcamentos/{id}/converter` | POST; cria e retorna a OS real |
| `/api/vitrine/pecas` | GET/POST; `/{id}` PUT/DELETE; ações de destaque/exibição |
| `/api/vitrine/pecas/{id}/imagem` | POST multipart PNG/JPEG/WebP até 5 MB |
| `/api/vitrine/publica` | GET público, somente peças ativas |
| `/api/vitrine/imagens/{nome}` | GET público da imagem enviada |
| `/api/relatorios/resumo` | GET com faturamento, recebido, a receber e ranking; filtros `de`/`ate` |
| `/api/relatorios/entregas` | GET com prazos de entrega |
| `/api/relatorios/produtividade` | GET com carga por funcionária |
| `/api/ordens-servico/{id}/pdf` | GET do comprovante PDF real da OS |

## Prazo e urgência

Cada serviço possui dias estimados no contrato do frontend e horas correspondentes no backend. A fila considera OSs aguardando, em produção ou em prova. Com responsável, usa a fila individual; sem responsável, a fila geral. Urgentes entram antes das não urgentes.

A API informa `impactosPrazo` quando a nova ordenação altera previsões existentes. Folgas e dias sem expediente explicitamente configurados são ignorados no cálculo e não aceitos para prova.

## Documentação de estudo

- `../DOCUMENTACAO_JAVA.md`: explicação de POO e das camadas.
- `../docs/auditoria-aulas.md`: conteúdos reais encontrados no repositório do professor.
- `../ACOMPANHAMENTO.md`: resultados executados por fase.
