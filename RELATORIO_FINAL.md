# Relatório final — Linha Fina Full Stack

Data da validação: **23/11/2026**.

## 1. Estrutura final do projeto

```text
linha fina/
├── front/                         # Interface original preservada
│   ├── index.html
│   ├── pages/
│   ├── css/
│   ├── assets/
│   ├── js/
│   │   ├── app/                   # boot, rotas, sessão e store
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/api/          # fetch e módulos REST existentes
│   │   └── config-api.js          # rotas reais administrativas
│   │   └── config-api-publica.js  # somente rotas da vitrine pública
│   ├── PRODUCT.md
│   ├── README.md
│   ├── server.mjs
│   └── package.json
├── backend/
│   ├── pom.xml
│   ├── .env.example
│   ├── README.md
│   └── src/
│       ├── main/java/br/com/linhafina/
│       │   ├── LinhaFinaApplication.java
│       │   ├── config/
│       │   ├── controller/
│       │   ├── dto/
│       │   ├── exception/
│       │   ├── model/
│       │   ├── repository/
│       │   └── service/
│       ├── main/resources/application.properties
│       └── test/                  # testes com PostgreSQL real
├── docs/
│   ├── auditoria-aulas.md
│   └── schema-postgresql.sql
├── tests/
│   ├── e2e/
│   └── artifacts/                 # resultados JSON dos fluxos
├── ACOMPANHAMENTO.md
├── DOCUMENTACAO_JAVA.md
├── RELATORIO_FINAL.md
├── INICIAR.ps1
└── TESTAR.ps1
```

Não foi criado frontend paralelo, React, Angular, Vue ou nova camada de repositories. O `httpClient.js` e o store existentes foram aproveitados.

## 2. Tecnologias e versões

| Tecnologia | Versão/utilização |
|---|---|
| Eclipse Temurin JDK | `21.0.13.1+2` LTS |
| Spring Boot | `3.5.7` |
| Apache Maven | `3.9.11` |
| Spring Web / Data JPA / Validation / Security | Versões gerenciadas pelo Spring Boot |
| Hibernate ORM | `6.6.33.Final` |
| PostgreSQL | `17.6`, servidor real em `localhost:5432` |
| OpenPDF | `1.3.39` |
| Node.js / npm | `24.21.0` / `11.19.0` |
| Testes | JUnit 5, MockMvc, Spring Security Test, Playwright Core + Edge |
| Frontend | HTML5, CSS3, JavaScript ES Modules, Fetch API |

Não foram utilizados Lombok, MapStruct, H2, microsserviços ou arquitetura adicional desnecessária.

## 3. Conceitos das aulas aplicados

A referência foi clonada e examinada no commit `5f57233ce45393ad9434464a1b8016ff9adf6a02`. Foram lidos 55 arquivos Java e dez `pom.xml`.

| Conteúdo real das aulas | Aplicação no Linha Fina |
|---|---|
| Classes e objetos | Entidades de clientes, OSs, serviços, orçamentos e usuários |
| Atributos e métodos | `Servico`, `OrdemServico.recalcularValorFinal`, regras dos Services |
| Encapsulamento | Atributos privados, getters/setters e validações antes da persistência |
| Construtores e `this` | Inicialização do domínio e construtores exigidos pelo JPA |
| Herança e `super()` | `Pessoa → Cliente/Funcionaria` |
| Sobrescrita | `getTipoPessoa()` com `@Override` nas subclasses |
| Polimorfismo | `List<Pessoa>` executa o comportamento da subclasse real |
| Interfaces | Contratos `JpaRepository<Entidade, Long>` |
| Sobrecarga | Construtores com assinaturas diferentes |
| Associação | OS → cliente/serviço/responsável; cliente ↔ ficha de medidas |
| Enums e `switch` | Status de OS, orçamento, pagamento e papel do usuário |
| Coleções e generics | Filas, respostas, mapas de ranking/produtividade |
| MVC/camadas/injeção | Controller REST → Service → Repository, injeção por construtor |
| Testes Spring | `@SpringBootTest`, MockMvc e banco de teste separado |

A auditoria completa está em `docs/auditoria-aulas.md`.

## 4. Implementação da herança

`Pessoa` é abstrata e concentra `id`, `nome`, `telefone`, `email` e `criadoEm`.

- `Cliente extends Pessoa`: adiciona cidade, observações e ficha de medidas.
- `Funcionaria extends Pessoa`: adiciona cargo, papel, status e especialidade.
- Ambas chamam `super(...)` e sobrescrevem `getTipoPessoa()`.
- `PessoaRepository` permite trabalhar polimorficamente com `List<Pessoa>`.
- A OS associa uma `Funcionaria` real como responsável.

Foi escolhida a estratégia JPA `JOINED`:

- `pessoas`: dados comuns e discriminador;
- `clientes`: mesma PK da pessoa + atributos específicos;
- `funcionarias`: mesma PK da pessoa + atributos específicos.

O teste `herancaDevePersistirNasTabelasEUsarPolimorfismo` verifica as três tabelas e os tipos retornados.

## 5. Modelagem do PostgreSQL

Bancos separados:

- `linhafina`: desenvolvimento;
- `linhafina_test`: testes, com `create-drop` e sem H2.

Tabelas principais:

| Tabela | Finalidade/relacionamentos |
|---|---|
| `pessoas`, `clientes`, `funcionarias` | Herança JOINED |
| `fichas_medidas` | Um para um com cliente |
| `servicos` | Catálogo, preço, dias/horas e situação |
| `ordens_servico` | FK cliente, serviço e responsável; valores, datas, status e pagamento |
| `orcamentos` | FK cliente/serviço e FK da OS convertida, única |
| `pagamentos` | Baixas associadas à OS |
| `usuarios` | E-mail único, hash BCrypt e papel |
| `configuracoes` | Preferências da instância do ateliê |
| `horarios_atendimento` | Sete dias, horários e fechamento semanal |
| `dias_de_folga` | Data única como PK |
| `pecas_vitrine` | Galeria, arte/foto, destaque e visibilidade |

`BigDecimal` corresponde a `NUMERIC`; `LocalDate` e `LocalDateTime` representam datas. Códigos de OS e orçamento usam sequências independentes. O esquema exportado do banco real está em `docs/schema-postgresql.sql`.

## 6. Endpoints criados

| Recurso | Operações |
|---|---|
| `/api/clientes` | GET/POST; `/{id}` GET/PUT/DELETE; PUT parcial de medidas |
| `/api/servicos` | GET/POST; `/{id}` GET/PUT/DELETE; `/{id}/situacao` PATCH |
| `/api/funcionarias` | GET/POST; `/{id}` PUT/DELETE |
| `/api/ordens-servico` | GET/POST; `/{id}` GET/PUT |
| `/api/ordens-servico/previsao` | POST: fila, horas, dias úteis e impactos sem salvar |
| `/api/ordens-servico/{id}/avancar-status` | POST |
| `/api/ordens-servico/{id}/cancelar` | POST com motivo |
| `/api/ordens-servico/{id}/prova` | POST com comparecimento ou remarcação |
| `/api/ordens-servico/{id}/pagamento` | POST com situação/valor |
| `/api/ordens-servico/{id}/pdf` | GET do PDF real |
| `/api/orcamentos` | GET/POST; `/{id}` GET/PUT |
| `/api/orcamentos/{id}/aprovar` | POST |
| `/api/orcamentos/{id}/recusar` | POST com motivo opcional |
| `/api/orcamentos/{id}/converter` | POST; retorna a OS criada |
| `/api/vitrine/pecas` | GET/POST; `/{id}` PUT/DELETE |
| `/api/vitrine/pecas/{id}/alternar-exibicao` | POST |
| `/api/vitrine/pecas/{id}/alternar-destaque` | POST |
| `/api/vitrine/pecas/{id}/imagem` | POST multipart PNG/JPEG/WebP |
| `/api/vitrine/publica` | GET público, somente ativas |
| `/api/vitrine/imagens/{nome}` | GET público da imagem |
| `/api/pagamentos` | GET das baixas; `/{id}` POST usando a regra da OS |
| `/api/relatorios/resumo` | GET com filtros opcionais `de`/`ate` |
| `/api/relatorios/entregas` | GET com filtros opcionais |
| `/api/relatorios/produtividade` | GET com filtros opcionais |
| `/api/configuracoes` | GET/PUT com merge por seção |
| `/api/autenticacao/entrar` | POST email/senha, cria sessão |
| `/api/autenticacao/sessao` | GET da identidade atual |
| `/api/autenticacao/sair` | POST para encerrar a sessão |

Respostas usam objetos/arrays compatíveis com o frontend, IDs string, números JSON e datas `YYYY-MM-DD`. Erros possuem JSON com `message`, `status`, `timestamp` e `path`.

## 7. Funcionalidades implementadas e verificadas

- CRUD real de clientes, incluindo cadastro rápido e ficha de medidas.
- CRUD de serviços, ativação/desativação e proteção do histórico.
- CRUD de funcionárias, vínculo de responsável e carga derivada no frontend.
- CRUD de OS, relacionamentos, cálculo de valores, avanço e cancelamento com motivo.
- Cálculo de prazo por horas, fila geral/individual, capacidade e prioridade urgente.
- Prévia antes de salvar e lista das OSs afetadas pela reordenação.
- Dias de folga/fechamento semanal e impedimento de prova incompatível.
- Login por sessão HttpOnly, BCrypt, logout, restauração e níveis de acesso.
- Orçamentos com edição, aprovação, recusa, expiração e conversão única em OS.
- Vitrine administrativa/pública, destaque, visibilidade e upload multipart.
- Agenda, dashboard e histórico usando as mesmas coleções reais.
- Prova obrigatória para peça sob medida, comparecimento, falta e remarcação.
- Taxa de guarda após tolerância, incluída no valor final.
- Bloqueio configurável de nova OS por pendência financeira/retirada.
- Desconto de fidelidade pela regra configurada e histórico de entregas.
- Pagamentos parciais/totais e histórico de baixas.
- Relatórios financeiros, ranking, entregas e produtividade.
- Exportação real da OS em PDF.
- Inicialização e testes com scripts locais e ferramentas portáteis.

Não foram inseridos dados fictícios de clientes, serviços ou OSs no banco de desenvolvimento. Os registros criados pelos testes E2E são removidos ao final.

## 8. Funcionalidades ainda pendentes

1. Envio de e-mail/SMTP quando a OS mudar de status.
2. Exportação CSV da página de relatórios; o PDF da OS está implementado.
3. Tela para administrar múltiplos usuários. O backend possui papéis e o administrador inicial local, mas a interface original não tinha CRUD de usuários.
4. Notificações externas por outros canais. O sino continua derivando avisos dos dados reais.
5. Configurações de produção: HTTPS, cookie `Secure`, proteção CSRF e política de autorização mais granular por recurso. O perfil atual é didático/local e deixa isso explícito.

Esses pontos não foram apresentados como prontos.

## 9. Resultado dos testes

### Maven/JUnit/MockMvc

```text
Tests run: 31, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

O comando final `mvn clean package` repetiu os 31 testes e gerou `backend/target/linha-fina-1.0.0.jar`. O JAR foi iniciado e verificado com PostgreSQL, login e listagem autenticada de pagamentos.

São 12 classes de teste cobrindo:

- CRUD e validações;
- persistência e herança JOINED/polimorfismo;
- relacionamentos e exclusões protegidas;
- fila, urgência e folgas;
- autenticação, sessão, hash e autorização;
- orçamento e conversão;
- pagamentos parciais/totais;
- taxa de guarda, bloqueio e fidelidade;
- prova e remarcação;
- vitrine pública/administrativa e upload;
- relatórios e assinatura `%PDF`.

### Navegador real — Edge

| Script | Verificações | Resultado |
|---|---|---|
| `tests/e2e/autenticacao.cjs` | Rota protegida, 401, login, sessão entre páginas, logout 204 | Aprovado |
| `tests/e2e/nucleo.cjs` | Cliente, serviço, funcionária, prévia, OS, PDF e avanço | Aprovado |
| `tests/e2e/complementos.cjs` | Orçamento→OS, vitrine, upload e página pública | Aprovado |
| `tests/e2e/configuracoes.cjs` | Taxa e folga persistidas/restauradas pela UI | Aprovado |

Medições do núcleo: **0 erros de console inesperados, 0 `pageerror`, 0 violações axe e sem overflow horizontal**. O 401 anterior ao login é esperado e contado separadamente. Os JSONs ficam em `tests/artifacts/`.

Durante o trabalho, falhas foram reproduzidas e corrigidas: montagem do rótulo do combobox, expectativa incorreta de um teste de folga, ordem de limpeza por FK e sincronização do teste de configurações. Nenhuma falha foi escondida da documentação de acompanhamento.

## 10. Como iniciar frontend e backend

### Caminho simples no Windows

```powershell
.\INICIAR.ps1
```

- Frontend: `http://localhost:5180`.
- API: `http://localhost:8080/api`.
- O script inicia o PostgreSQL somente se a porta estiver livre e evita duplicar servidores.

A conta administrativa deste ambiente usa `linha-fina@gmail.com`. A senha aleatória está somente em `backend/.env`, que não é versionado. Para outro ambiente, defina suas próprias variáveis a partir de `backend/.env.example`.

### Manual

```bash
cd backend
mvn spring-boot:run
```

```bash
cd front
node server.mjs
```

### Testes

```powershell
.\TESTAR.ps1
```

ou:

```bash
cd backend
mvn test
```

Com frontend/backend ativos:

```bash
node tests/e2e/autenticacao.cjs
node tests/e2e/nucleo.cjs
node tests/e2e/complementos.cjs
node tests/e2e/configuracoes.cjs
```

## 11. Localização da documentação

- `DOCUMENTACAO_JAVA.md`: guia de estudo de POO e das camadas.
- `docs/auditoria-aulas.md`: evidências reais do repositório do professor.
- `docs/schema-postgresql.sql`: esquema exportado do PostgreSQL.
- `backend/README.md`: configuração e funcionamento do backend.
- `ACOMPANHAMENTO.md`: resultados por fase.
- `RELATORIO_FINAL.md`: este relatório.
- `tests/artifacts/`: evidências E2E em JSON.

## 12. Como apresentar a implementação Java na FATEC

1. Comece pelo domínio: cliente chega com peça, escolhe serviço e abre OS.
2. Mostre `Pessoa.java`, `Cliente.java` e `Funcionaria.java`: `abstract`, `extends`, `super()` e `@Override`.
3. Explique o polimorfismo com `List<Pessoa>` e o teste das três tabelas.
4. Abra `OrdemServico.java`: atributos privados, associações e `recalcularValorFinal()`.
5. Siga uma requisição: formulário → store → fetch → Controller → Service → Repository → PostgreSQL.
6. Mostre `StatusOrdem.proximo()` como enum + regra de negócio.
7. Explique `PrazoService`: `ArrayList`, horas acumuladas, capacidade, ordenação e folgas.
8. Demonstre uma operação real de criação e a prévia calculada pela API.
9. Mostre autenticação BCrypt/sessão e explique por que a senha não fica no navegador.
10. Finalize com `mvn test` e um fluxo E2E, apresentando os resultados e as pendências com transparência.
