# Documentação Java — Linha Fina

Este documento foi escrito para estudo e apresentação do projeto. A referência de POO é o repositório real das aulas: <https://github.com/MaykonRO/fatec.poo.aulas>. A auditoria dos arquivos está em `docs/auditoria-aulas.md`.

## 1. O caminho de uma operação

Exemplo: cadastrar uma cliente.

1. O formulário chama `acoes.clientes.criar(dados)` no frontend.
2. O store chama `clientesApi.criar`, usando o `httpClient.js` já existente.
3. O `fetch` envia JSON para `POST http://localhost:8080/api/clientes`.
4. `ClienteController` recebe o JSON em `ClienteRequest`.
5. `ClienteService` normaliza/valida os dados e cria um objeto `Cliente`.
6. `ClienteRepository`, fornecido pelo Spring Data JPA, salva o objeto.
7. Hibernate executa o SQL no PostgreSQL.
8. O backend devolve `ClienteResponse`, com o ID real e os dados persistidos.
9. O store relê as coleções e a interface mostra o registro confirmado pela API.

Não há banco de dados no navegador. O `localStorage` continua restrito à preferência visual original.

## 2. Classes, objetos, atributos e métodos

Uma **classe** é o modelo de um objeto. `Cliente` descreve quais dados e comportamentos uma cliente possui. Um **objeto** é uma instância concreta dessa classe:

```java
Cliente cliente = new Cliente();
cliente.setNome("Maria");
```

- `Cliente` é a classe.
- `new Cliente()` cria o objeto e chama um construtor.
- `cliente` é a referência usada para alcançar o objeto.
- `nome` é um atributo/estado.
- `setNome(...)` é um método/comportamento.

Isso corresponde às classes `Cachorro` e `Contador` da aula 1 e à instanciação com `new` vista no repositório.

## 3. Encapsulamento

Os atributos das entidades são `private`. O acesso ocorre por getters, setters ou métodos de negócio:

```java
private BigDecimal valorServico;

public BigDecimal getValorServico() {
    return valorServico;
}
```

O encapsulamento impede que outras classes alterem campos diretamente sem passar pela interface pública da classe. As validações ficam nos DTOs e Services; cálculos que pertencem ao próprio objeto, como `OrdemServico.recalcularValorFinal()`, ficam na entidade.

Referência das aulas: `Foo` e `Aluno`, da aula 3. A aula também mostra que um setter sem validação pode aceitar estado inválido; por isso o Linha Fina valida as entradas antes de persistir.

## 4. Construtores, `this` e `super()`

Um construtor tem o mesmo nome da classe e não possui tipo de retorno. Ele inicializa o objeto.

```java
public Cliente(String nome, String telefone, String email, String cidade) {
    super(nome, telefone, email);
    this.cidade = cidade;
}
```

- `super(...)` chama o construtor da superclasse `Pessoa`.
- `this.cidade` é o atributo do objeto; `cidade`, sem `this`, é o parâmetro.
- O construtor vazio `public Cliente() { super(); }` é necessário para o JPA criar instâncias durante as consultas.
- Construtores com parâmetros diferentes demonstram **sobrecarga**.

Referências: `Aluno` da aula 2 (`this`), `Cachorro` da aula 8 (`super`) e `Cliente` da aula 10 (construtores sobrecarregados).

## 5. Herança real: Pessoa, Cliente e Funcionaria

### Estrutura

```text
Pessoa (abstract)
├── Cliente
└── Funcionaria
```

`Pessoa` concentra o que é comum:

| Atributo | Tipo | Significado |
|---|---|---|
| `id` | `Long` | Chave primária gerada pelo banco |
| `nome` | `String` | Nome da pessoa |
| `telefone` | `String` | Contato telefônico |
| `email` | `String` | Contato eletrônico |
| `criadoEm` | `LocalDateTime` | Momento de cadastro |

`Cliente extends Pessoa` e adiciona:

| Atributo | Tipo | Significado |
|---|---|---|
| `cidade` | `String` | Cidade da cliente |
| `observacoes` | `String` | Preferências e anotações |
| `medidas` | `FichaMedidas` | Ficha associada um para um |

`Funcionaria extends Pessoa` e adiciona:

| Atributo | Tipo | Significado |
|---|---|---|
| `cargo` | `String` | Função descrita na equipe |
| `papel` | `String` | Papel de acesso: dono, admin, líder, funcionário ou atendimento |
| `status` | `String` | Disponível, em serviço ou afastada |
| `especialidade` | `String` | Tipos de trabalho conhecidos |

A herança é usada de verdade: os CRUDs persistem as subclasses, e `OrdemServico` associa uma `Funcionaria` como responsável. Não é uma classe criada apenas para demonstrar sintaxe.

### Por que `Pessoa` é abstrata?

Não faz sentido cadastrar uma pessoa genérica no ateliê sem que ela seja cliente ou funcionária. `abstract` impede `new Pessoa()`, mas permite usar `Pessoa` como tipo de referência e superclasse.

### Sobrescrita e polimorfismo

`Pessoa` declara:

```java
public abstract String getTipoPessoa();
```

As duas subclasses usam `@Override` e devolvem seu próprio tipo. Em uma coleção de pessoas:

```java
List<Pessoa> pessoas = pessoaRepository.findAll();
for (Pessoa pessoa : pessoas) {
    pessoa.getTipoPessoa();
}
```

Java escolhe a implementação de `Cliente` ou `Funcionaria` conforme o objeto real. Isso é **polimorfismo em tempo de execução**, equivalente ao `ArrayList<Animal>` e ao `emitirSom()` das aulas 8 e 9.

### Herança no PostgreSQL

A anotação é:

```java
@Inheritance(strategy = InheritanceType.JOINED)
```

- `pessoas`: ID e dados comuns.
- `clientes`: mesma ID da pessoa + dados de cliente.
- `funcionarias`: mesma ID da pessoa + dados da equipe.
- `tipo_pessoa`: discriminador para o Hibernate reconhecer a subclasse.

`JOINED` foi escolhido porque é simples de visualizar nas tabelas, evita repetição e mantém os atributos específicos separados. O teste de integração consulta as três tabelas e também verifica o comportamento polimórfico.

## 6. Entidades e seus atributos

### `Servico`

| Atributo | Tipo | Uso |
|---|---|---|
| `id` | `Long` | Identificador |
| `nome` | `String` | Nome exibido no catálogo |
| `categoria` | `String` | Agrupamento e relatórios |
| `descricao` | `String` | Detalhes do que está incluído |
| `precoReferencia` | `BigDecimal` | Preço-base, com duas casas decimais |
| `tempoEstimadoDias` | `Integer` | Contrato visual do catálogo |
| `tempoEstimadoHoras` | `Integer` | Carga usada no cálculo da fila |
| `ativo` | `Boolean` | Permite novas OS ou preserva apenas o histórico |

### `FichaMedidas`

Possui `id`, referência única `cliente`, medidas `BigDecimal` (`busto`, `cintura`, `quadril`, `ombro`, `manga`, `comprimento`) e `observacoes`. A associação é um para um. `Cliente.setMedidas` também liga o outro lado da relação, mantendo os objetos coerentes.

### `OrdemServico`

| Grupo | Atributos |
|---|---|
| Identidade | `id`, `codigo`, `criadoEm` |
| Associações | `cliente`, `servico`, `responsavel` |
| Peça | `tipoPeca`, `descricaoPeca`, `observacoes`, `sobMedida`, `ajuste` |
| Prioridade | `urgente` |
| Valores | `valorServico`, `taxaUrgencia`, `taxaGuarda`, `desconto`, `valorFinal`, `valorPago` |
| Datas | `dataEntrada`, `dataPrevistaEntrega`, `dataProva`, `dataPronta`, `dataEntrega`, `dataPagamento` |
| Fluxo | `status`, `pagamentoStatus`, `motivoCancelamento`, `provaComparecida` |

`BigDecimal` evita os problemas de arredondamento de `double` em dinheiro. `LocalDate` representa datas sem horário; `LocalDateTime` representa o registro de criação.

### `Pagamento`

Cada baixa possui `id`, a `ordemServico` associada, `valor`, `dataPagamento` e `criadoEm`. A OS guarda o total pago para as consultas rápidas do frontend; a tabela de pagamentos preserva as operações individuais.

### Enums

`StatusOrdem` define `AGUARDANDO`, `PRODUCAO`, `PROVA`, `PRONTA`, `ENTREGUE`, `CANCELADA`. O método `proximo()` usa `switch` e impede avanço depois de entregue/cancelada.

`StatusPagamento` define `PENDENTE`, `PARCIAL`, `PAGO`. Os métodos `paraApi()` e `deTexto()` convertem entre o enum Java e o vocabulário do frontend.

Referência: enums e `switch` da aula 2.

## 7. Coleções e generics

O projeto usa `List<ClienteResponse>`, `List<OrdemServico>` e outras coleções tipadas. O tipo entre `< >` é um parâmetro genérico e ajuda o compilador a evitar inserções erradas.

`JpaRepository<Cliente, Long>` significa: repositório para a entidade `Cliente`, cuja chave é `Long`.

A fila de prazo usa `ArrayList<OrdemServico>`, ordenação e for-each. Essa é uma aplicação direta das coleções da aula 6. Não usamos array fixo porque a quantidade de ordens muda.

## 8. Controllers

Um Controller é a entrada HTTP. Não salva entidades diretamente nem concentra cálculo.

| Classe | Responsabilidade |
|---|---|
| `ClienteController` | CRUD de `/api/clientes` |
| `ServicoController` | CRUD e situação de `/api/servicos` |
| `FuncionariaController` | CRUD de `/api/funcionarias` |
| `OrdemServicoController` | CRUD, prévia, status, cancelamento e pagamento de OS |
| `ConfiguracaoController` | Leitura e atualização por seção das configurações |
| `AutenticacaoController` | Login, sessão atual e logout |
| `OrcamentoController` | CRUD, aprovação, recusa e conversão de orçamentos |
| `VitrineController` | CRUD, imagens e galeria pública |
| `PagamentoController` | Histórico de baixas e registro pela rota de pagamentos |
| `RelatorioController` | Resumo financeiro, entregas e produtividade |

Anotações principais:

- `@RestController`: respostas JSON.
- `@RequestMapping`: prefixo da rota.
- `@GetMapping`, `@PostMapping`, `@PutMapping`, `@PatchMapping`, `@DeleteMapping`: verbo e caminho.
- `@PathVariable`: ID na URL.
- `@RequestBody`: JSON convertido em DTO.
- `@Valid`/`@Validated`: executa Bean Validation.

## 9. Services

Um Service contém regras de negócio e transações.

| Classe | Regras principais |
|---|---|
| `ClienteService` | Normalizar telefone, aceitar cadastro rápido, manter medidas e proteger histórico |
| `ServicoService` | CRUD, ativação, horas estimadas e impedir exclusão em uso |
| `FuncionariaService` | CRUD, situações válidas e impedir remoção com OS |
| `OrdemServicoService` | Associações, valores, urgência, datas, fluxo, cancelamento e pagamentos |
| `PrazoService` | Fila, prioridade, capacidade diária, dias úteis e impactos |
| `ConfiguracaoService` | Preferências persistidas, taxa, horários e folgas |
| `AutenticacaoService` | BCrypt, criação/recuperação/encerramento da sessão |
| `OrcamentoService` | Validade, estados e conversão única em OS |
| `VitrineService` | Peças ativas/inativas e destaque |
| `ImagemVitrineService` | Upload confinado, validação e remoção de arquivos |
| `PagamentoService` | Listagem das baixas persistidas |
| `RelatorioService` | Coleções e mapas para agregações por período |
| `PdfOrdemServicoService` | Documento PDF com dados reais da OS |

`@Transactional` garante que operações relacionadas sejam confirmadas juntas. Se uma regra falhar, a transação não deixa meia operação salva. `readOnly = true` indica consultas.

A injeção é feita pelo construtor: o Spring fornece os objetos necessários. Isso dispensa `new` nos repositories dentro dos services e facilita testes.

## 10. Repositories e Spring Data JPA

Um Repository é uma interface que herda operações de `JpaRepository`:

```java
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
}
```

O Spring cria a implementação. Métodos como `findAll`, `findById`, `save` e `delete` já vêm prontos. Consultas específicas seguem nomes compreensíveis, como `existsByClienteId`.

JPA é a especificação de mapeamento objeto-relacional. Hibernate é a implementação usada pelo Spring Boot. As anotações `@Entity`, `@Id`, `@Column`, `@ManyToOne` e `@OneToOne` explicam como os objetos correspondem às tabelas.

## 11. DTOs e validação

DTO significa Data Transfer Object. `ClienteRequest` representa dados que entram; `ClienteResponse` representa dados que saem.

Motivos para não expor a entidade JPA diretamente:

1. controlar exatamente o contrato do frontend;
2. devolver IDs como strings para os deep-links existentes;
3. evitar serializar associações LAZY em cadeia;
4. não expor campos internos;
5. validar a entrada antes de alterar a entidade.

Bean Validation usa anotações como `@NotBlank`, `@NotNull`, `@Email`, `@DecimalMin` e `@Min`. O grupo `Criacao` permite que o PUT de medidas envie apenas `{medidas: ...}` sem apagar os demais dados.

`ApiExceptionHandler` padroniza erros em JSON com `message`, `status`, `timestamp` e `path`. `RegraNegocioException` representa uma regra violada; `RecursoNaoEncontradoException` representa um ID inexistente.

## 12. Configuração, Spring Boot e CORS

`LinhaFinaApplication` possui `main` e `@SpringBootApplication`. O Spring Boot:

- encontra controllers, services, repositories e entidades;
- configura o servidor Web;
- cria a conexão com PostgreSQL;
- monta os objetos e suas dependências;
- converte JSON com Jackson.

`application.properties` contém propriedades não secretas e referências a variáveis. `backend/.env`, ignorado pelo Git, guarda a senha local.

`CorsConfig` permite o frontend local (`localhost`/`127.0.0.1`) e os métodos usados. CORS não é banco de dados nem autenticação: é a autorização do navegador para chamadas entre origens diferentes.

## 13. Como o frontend conversa com o backend

`front/js/config-api.js` define a base `http://localhost:8080/api` e os caminhos lógicos. `config.js` lê essa configuração; `httpClient.js` executa `fetch`; `api/index.js` dá nomes às operações; `store.js` guarda o estado e reconcilia após mutações.

A API devolve arrays completos, não `Page` do Spring, porque dashboard, agenda e relatórios já calculam suas derivações sobre as coleções completas. Datas de negócio seguem `YYYY-MM-DD`, valores são números JSON e IDs são strings.

## 14. Relação direta com as aulas

| Conteúdo das aulas | Arquivo Java no Linha Fina | Aplicação real |
|---|---|---|
| Classes e objetos | `model/Cliente.java`, `model/OrdemServico.java` | Clientes e OSs são objetos persistidos e relacionados |
| Atributos e métodos | `model/Servico.java` | Catálogo com estado e acessores |
| Encapsulamento | `model/Pessoa.java`, `model/OrdemServico.java` | Campos privados e mudanças por métodos |
| Construtores | `model/Cliente.java`, `model/Servico.java` | Inicialização do JPA e de objetos do domínio |
| `this` | `model/Servico.java` | Diferencia parâmetros dos atributos |
| Herança | `model/Cliente.java`, `model/Funcionaria.java` | Especializações reais de `Pessoa` |
| `super()` | `model/Cliente.java` | Inicializa nome, telefone e email na superclasse |
| Sobrescrita | `model/Cliente.java`, `model/Funcionaria.java` | `@Override` em `getTipoPessoa()` |
| Polimorfismo | `repository/PessoaRepository.java` e testes | `List<Pessoa>` executa comportamento da subclasse real |
| Interfaces | `repository/ClienteRepository.java` | Contrato `JpaRepository` implementado pelo Spring |
| Sobrecarga | Construtores das entidades | Formas diferentes de inicialização |
| Associação | `model/OrdemServico.java`, `model/FichaMedidas.java` | OS → cliente/serviço/responsável; cliente ↔ medidas |
| Enums e `switch` | `model/StatusOrdem.java` | Fluxo oficial de etapas |
| Coleções | `service/PrazoService.java` | Fila com `ArrayList` e iteração |
| Generics | Repositories e DTOs de lista | Tipagem de entidades, IDs e respostas |
| MVC/camadas/injeção | Controllers, Services e Repositories | API REST com dependências pelo construtor |
| Testes Spring | `NucleoIntegrationTest.java` | Contexto real e operações HTTP com PostgreSQL |

Records foram encontrados nas aulas, mas os DTOs principais foram mantidos como classes para praticar construtores, atributos e encapsulamento.

## 15. Como apresentar na FATEC

1. **Mostre o domínio.** Explique que uma OS pertence a uma cliente, usa um serviço e pode ter uma funcionária.
2. **Abra `Pessoa`.** Mostre atributos privados, `abstract`, construtor e `getTipoPessoa()`.
3. **Abra `Cliente` e `Funcionaria`.** Aponte `extends`, `super()` e `@Override`.
4. **Mostre o polimorfismo.** Use o teste que percorre `List<Pessoa>` e obtém “Cliente” e “Funcionaria”.
5. **Explique uma requisição.** Siga o cadastro de cliente do formulário ao PostgreSQL e de volta.
6. **Mostre uma regra.** Use `StatusOrdem.proximo()` ou `OrdemServico.recalcularValorFinal()`.
7. **Mostre a fila.** Explique `List`, horas acumuladas, capacidade diária e prioridade de urgente.
8. **Mostre as tabelas.** Aponte a chave compartilhada da herança e as chaves estrangeiras da OS.
9. **Execute os testes.** Apresente o resultado real de `mvn test` e o fluxo E2E.
10. **Seja transparente.** Diferencie módulos concluídos dos que ainda não foram implementados.

## 16. Modelos e regras complementares

### Configuração, horários e folgas

`Configuracao` usa ID `1` porque existe uma configuração do ateliê. Seus atributos privados guardam dados de contato, taxa de urgência, fidelidade, notificações e preferências de interface.

`HorarioAtendimento` possui `id` (`seg` a `dom`), `rotulo`, `ativo`, `abre` e `fecha`. `ativo = null` significa não informado; somente `false` fecha o dia. `DiaDeFolga` usa a própria `LocalDate data` como chave primária, impedindo duplicidade.

`ConfiguracaoService` faz merge das seções recebidas e oferece `diaFechado`, `obterTaxaUrgenciaPadrao` e `obterFidelidade` para as demais regras. Isso mostra associação entre Services sem criar microsserviços.

### Usuário e segurança

`Usuario` possui `id`, `nome`, `email`, `senhaHash`, `papel` e `ativo`. A senha digitada não é um atributo persistido: somente o hash BCrypt fica no banco.

`Papel` é um enum com `DONO`, `ADMIN`, `LIDER`, `FUNCIONARIO` e `ATENDIMENTO`, cada um com rótulo. `AutenticacaoService` compara a senha com `PasswordEncoder.matches`, cria o `SecurityContext` e salva a sessão no servidor. `SecurityConfig` define quais rotas são públicas e quais exigem papel administrativo.

`UsuarioInicializador` só cria o administrador quando a tabela está vazia e as variáveis locais foram configuradas. Não existe usuário ou senha fixa versionada.

### Orçamento

`Orcamento` contém `id`, `codigo`, `cliente`, `servico` opcional, `descricao`, `valorEstimado`, `dataCriacao`, `validade`, `status`, `motivo` e `convertidoOs`.

`StatusOrcamento` define pendente, aprovado, recusado, expirado e convertido. `OrcamentoService` controla as transições e, na conversão, monta uma `OrdemServicoRequest` com os dados reais do orçamento. Sem serviço não há conversão, pois o sistema não inventa tempo ou preço.

### Vitrine e imagem

`PecaVitrine` possui `id`, `nome`, `categoria`, `descricao`, `preco`, `arte`, `destaque`, `ativo`, `imagemUrl` e `criadoEm`. A arte é a ilustração original usada quando não existe foto.

`ImagemVitrineService` aceita multipart PNG/JPEG/WebP de até 5 MB. Gera UUID, resolve o caminho dentro do diretório autorizado e guarda apenas a URL no banco. O endpoint administrativo e o público são separados.

### Pagamentos, relatórios e PDF

`PagamentoResponse` transforma cada baixa sem expor a entidade JPA. `PagamentoController` reutiliza `OrdemServicoService.registrarPagamento`, evitando duas regras divergentes.

`RelatorioService` percorre coleções e usa `Map<Long, Map<String, Object>>` para ranking e produtividade. É uma aplicação direta dos mapas e generics vistos na aula 6.

`PdfOrdemServicoService` usa OpenPDF e escreve o documento em `ByteArrayOutputStream`. O Controller devolve `application/pdf`; o teste confirma a assinatura `%PDF` e o navegador baixa o arquivo pelo link do drawer.

### Regras complementares de OS

- `dataPronta` registra quando a peça ficou pronta.
- `calcularTaxaGuarda` compara entrega real e tolerância e inclui `taxaGuarda` no valor final.
- `verificarPendencias` pode bloquear nova OS por pagamento pendente ou peça não retirada.
- `aplicarDescontoFidelidade` consulta configuração e quantidade de entregas.
- `registrarProva` confirma comparecimento ou remarca a falta; `previsaoAposFalta` calcula a nova data.
- `provaComparecida` impede pular a etapa obrigatória de uma peça sob medida.

## 17. Como executar e testar

No Windows, `INICIAR.ps1` prepara o PostgreSQL e abre os dois servidores. A alternativa manual está em `backend/README.md`.

```bash
cd backend
mvn spring-boot:run
```

```bash
cd front
node server.mjs
```

```bash
cd backend
mvn test
```

O banco `linhafina_test` é separado do banco `linhafina`. Não é usado H2. A validação final executou **31 testes Java sem falhas**, quatro fluxos E2E no Edge e `mvn clean package`. Os resultados e evidências por fase ficam em `ACOMPANHAMENTO.md`.
