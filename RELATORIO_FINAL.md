# Relatório final — MVP do Linha Fina

## 1. Escopo final

O projeto foi reduzido para um sistema pequeno e funcional de ateliê de costura, mantendo somente Login, Clientes e Ordens de Serviço.

### Funcionalidades mantidas

- Login por e-mail e senha, sessão HttpOnly, proteção de rotas e logout.
- CRUD de clientes com nome, telefone e e-mail.
- Exclusão de cliente bloqueada quando existe OS vinculada.
- CRUD de OS com cliente, descrição, valor, data de entrada, previsão e status.
- Status: pendente, em andamento, concluída e cancelada.
- Exclusão real da OS.
- Tema escuro violeta, responsividade e componentes reutilizáveis.
- PostgreSQL real, Spring Security, Spring Data JPA, DTOs e validações.

### Funcionalidades removidas

Orçamentos, pagamentos, financeiro avançado, dashboard com indicadores avançados, relatórios, PDF, vitrine, upload, catálogo de serviços, funcionárias, produtividade, cálculo automático de capacidade, horários e folgas, provas, medidas, urgência, guarda, fidelidade, descontos, notificações avançadas, configurações e agenda.

## 2. Estrutura final do backend

A produção passou de 89 para 27 arquivos Java, mantendo:

```text
LinhaFinaApplication
config/
  CorsConfig
  SecurityConfig
  UsuarioInicializador
controller/
  AutenticacaoController
  ClienteController
  OrdemServicoController
service/
  AutenticacaoService
  ClienteService
  OrdemServicoService
repository/
  UsuarioRepository
  ClienteRepository
  OrdemServicoRepository
model/
  Usuario
  Cliente
  OrdemServico
  Papel
  StatusOrdem
dto/
  LoginRequest
  UsuarioResponse
  ClienteRequest
  ClienteResponse
  OrdemServicoRequest
  OrdemServicoResponse
exception/
  ApiExceptionHandler
  RecursoNaoEncontradoException
  RegraNegocioException
```

Foram removidos 62 arquivos Java de produção e 12 testes antigos. A dependência OpenPDF também foi removida do `pom.xml`.

## 3. Estrutura final do frontend

Páginas mantidas:

- `index.html`: boas-vindas e acesso aos módulos.
- `pages/login.html`: login.
- `pages/clientes.html`: CRUD de clientes.
- `pages/ordens-servico.html`: listagem, consulta e exclusão de OS.
- `pages/ordem-servico-form.html`: criação e edição de OS.

Foram removidas 11 páginas HTML e 11 módulos JavaScript fora do MVP, além de arte/gráficos/estatísticas, configuração pública, capturas antigas e E2E de módulos removidos.

O store contém somente clientes, ordens e autenticação. Não há mocks nem persistência de negócio no navegador.

## 4. Banco de dados

Tabelas mantidas:

- `usuarios`
- `clientes`
- `ordens_servico`

Tabelas removidas:

- `pessoas`
- `fichas_medidas`
- `funcionarias`
- `servicos`
- `orcamentos`
- `pagamentos`
- `pecas_vitrine`
- `configuracoes`
- `horarios_atendimento`
- `dias_de_folga`

A migração `backend/db/migration/V1__simplificar_mvp.sql` preserva IDs, códigos, clientes e OS existentes, converte os status antigos e cria `clientes_id_seq` para novos cadastros. A constraint antiga de status é removida.

O esquema atual está em `docs/schema-postgresql.sql`.

## 5. Backup

Antes das remoções foram criados:

- Branch Git `backup/pre-mvp`.
- Tag `backup/pre-mvp-20261124`.
- `backups/pre-mvp-source.zip`.
- `backups/pre-mvp-local.dump`.
- `backups/pre-mvp-render.dump`.

Esses arquivos locais não são enviados ao Git.

## 6. Testes executados

### Backend

Comando:

```text
mvn -B -ntp clean test
```

Resultado:

```text
Tests run: 6, Failures: 0, Errors: 0, Skipped: 0
BUILD SUCCESS
```

Os testes cobrem login/sessão/logout, CRUD de cliente, bloqueio de exclusão com OS, CRUD de OS e validações de cliente e OS, usando `linhafina_test`.

### Frontend/E2E

Comando:

```text
node tests/e2e/mvp.cjs
```

Fluxos aprovados:

- rota protegida e login real;
- criar, ler, editar e excluir cliente;
- criar, ler, editar e excluir OS;
- atualização de status;
- menu mobile acessível;
- viewports 390 px e 1440 px sem overflow;
- limpeza dos registros no final, na ordem OS → cliente.

Resultado: `consoleErrors: []` e `pageErrors: []`.

## 7. Problemas corrigidos

- Sequência de identidade dos clientes após a remoção da herança `Pessoa`.
- Constraint antiga de status incompatível com os novos valores.
- Verificação de viewport aguardando a estabilização das media queries, evitando falso positivo de overflow.

## 8. Problemas restantes

Nenhum problema funcional conhecido nos módulos do MVP. A proteção CSRF continua simplificada para uso acadêmico e deve ser revista antes de uma implantação pública mais ampla.
