# Documentação Java — MVP do Linha Fina

Este projeto demonstra uma aplicação simples de Programação Orientada a Objetos com Java, Spring Boot e PostgreSQL.

## Fluxo de uma operação

```text
Formulário → store → Fetch API → Controller → Service → Repository → PostgreSQL
```

1. O frontend envia JSON para a API.
2. O Controller recebe um DTO e valida a entrada.
3. O Service aplica as regras de negócio.
4. O Repository persiste a entidade usando Spring Data JPA.
5. A API devolve outro DTO com o ID e os dados reais salvos.

## Classes e objetos

Uma classe é um modelo; um objeto é uma instância concreta dela:

```java
Cliente cliente = new Cliente();
cliente.setNome("Maria");
```

- `Cliente` é a classe.
- `new Cliente()` cria o objeto e chama um construtor.
- `cliente` é a referência ao objeto.
- `nome` é um atributo.
- `setNome()` é um método.

## Encapsulamento

Os atributos são `private` e o acesso ocorre por getters e setters. Isso evita que outras classes alterem campos diretamente sem passar pela interface pública.

```java
private String nome;

public String getNome() {
    return nome;
}

public void setNome(String nome) {
    this.nome = nome;
}
```

As validações ficam nos DTOs e Services; as associações e dados das entidades ficam nas classes de modelo.

## Construtores e `this`

Construtores inicializam objetos. O JPA exige um construtor vazio para criar entidades durante as consultas. Outros construtores podem receber dados do domínio.

```java
public Cliente(String nome, String telefone, String email) {
    this.nome = nome;
    this.telefone = telefone;
    this.email = email;
}
```

`this.nome` é o atributo do objeto; `nome`, sem `this`, é o parâmetro.

## Entidades do MVP

### `Usuario`

| Atributo | Tipo | Uso |
|---|---|---|
| `id` | `Long` | Chave primária |
| `nome` | `String` | Nome do usuário |
| `email` | `String` | Login único |
| `senhaHash` | `String` | Hash BCrypt, nunca a senha original |
| `papel` | `Papel` | Permissões |
| `ativo` | `Boolean` | Permite ou bloqueia o login |

### `Cliente`

| Atributo | Tipo | Uso |
|---|---|---|
| `id` | `Long` | Chave primária |
| `nome` | `String` | Nome da cliente |
| `telefone` | `String` | Contato |
| `email` | `String` | Contato eletrônico |
| `criadoEm` | `LocalDateTime` | Data de cadastro |

### `OrdemServico`

| Atributo | Tipo | Uso |
|---|---|---|
| `id` | `Long` | Chave primária |
| `codigo` | `String` | Código sequencial da OS |
| `cliente` | `Cliente` | Cliente proprietária da OS |
| `descricaoServico` | `String` | Descrição do trabalho |
| `valor` | `BigDecimal` | Valor do serviço |
| `dataEntrada` | `LocalDate` | Data de entrada |
| `dataPrevistaEntrega` | `LocalDate` | Previsão de entrega |
| `status` | `StatusOrdem` | Estado atual |
| `criadoEm` | `LocalDateTime` | Data de criação |

## Associação entre objetos

`OrdemServico` possui uma referência a `Cliente`. No banco, isso se torna a coluna `cliente_id`, uma chave estrangeira obrigatória. O Service só cria uma OS se a cliente existir, e a exclusão da cliente é bloqueada quando há OS vinculada.

## Enums

`StatusOrdem` representa `PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDA` e `CANCELADA`. `Papel` representa os níveis de acesso. Enums evitam strings livres inválidas e centralizam o vocabulário.

## Controllers

- `AutenticacaoController`: login, sessão e logout.
- `ClienteController`: CRUD de clientes.
- `OrdemServicoController`: CRUD de OS.

O Controller recebe a requisição HTTP e devolve o DTO, sem concentrar regras de negócio.

## Services

- `AutenticacaoService`: valida credenciais, cria e encerra a sessão.
- `ClienteService`: valida cliente e impede exclusão com OS vinculada.
- `OrdemServicoService`: valida cliente, valor e datas antes de salvar.

`@Transactional` garante que a operação e seus relacionamentos sejam confirmados juntos.

## Repositories e JPA

```java
public interface ClienteRepository extends JpaRepository<Cliente, Long> {
}
```

O Spring cria a implementação. `JpaRepository<Cliente, Long>` usa generics para indicar o tipo da entidade e da chave.

JPA mapeia objetos para tabelas com `@Entity`, `@Id`, `@Column`, `@ManyToOne` e `@JoinColumn`. Hibernate executa o SQL real no PostgreSQL.

## DTOs e validação

- `ClienteRequest`: nome, telefone e email recebidos.
- `ClienteResponse`: dados devolvidos com ID string e data de criação.
- `OrdemServicoRequest`: cliente, descrição, valor, datas e status.
- `OrdemServicoResponse`: dados completos da OS.

IDs são strings para compatibilidade com os deep-links do frontend. Valores usam `BigDecimal`, evitando erros comuns de arredondamento de `double` em dinheiro.

## Segurança

O login usa `BCryptPasswordEncoder.matches`. A senha persistida é apenas o hash. A sessão usa cookie HttpOnly; o frontend consulta a identidade atual pela API e não armazena a senha.

## Testes

Os testes usam PostgreSQL real em `linhafina_test`, sem H2, cobrindo autenticação, CRUD de clientes, CRUD de OS e validações. O E2E percorre os formulários no Edge e remove seus registros ao final.

## Como apresentar

1. Mostre `Usuario`, `Cliente` e `OrdemServico` como classes com atributos privados.
2. Explique construtores, getters, setters e encapsulamento.
3. Mostre a associação `OrdemServico → Cliente` e sua chave estrangeira.
4. Siga uma requisição do formulário ao PostgreSQL.
5. Explique `StatusOrdem`, DTOs e validações.
6. Execute os testes e mostre uma OS sendo criada, editada e excluída.
