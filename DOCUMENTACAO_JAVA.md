# Documentação Java — MVP do Linha Fina

Este projeto demonstra uma aplicação simples de Programação Orientada a Objetos com Java, Spring Boot e PostgreSQL.

O detalhamento de herança, abstração, polimorfismo e sobrescrita está em [CONCEITOS_JAVA.md](CONCEITOS_JAVA.md).

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

## Herança e abstração

`Pessoa` é uma classe abstrata com `id`, `nome` e `email`. `Cliente` e `Usuario` herdam esses campos e implementam o método abstrato `getTipoPessoa()`.

```java
public abstract class Pessoa {
    public abstract String getTipoPessoa();
}

public class Cliente extends Pessoa {
    @Override
    public String getTipoPessoa() {
        return "cliente";
    }
}
```

`@MappedSuperclass` copia os campos da classe base para as tabelas das filhas. O banco continua com `usuarios`, `clientes` e `ordens_servico`, sem tabela `pessoas`.

## Polimorfismo e sobrescrita

Uma referência `Pessoa` pode apontar para `Cliente` ou `Usuario`. O método executado é o da classe real do objeto.

```java
Pessoa pessoa = new Cliente("Maria", "11999999999", "maria@teste.local");
System.out.println(pessoa.getTipoPessoa()); // cliente
```

`PessoaTest` comprova esse comportamento e a sobrescrita de `getTipoPessoa()`.

## Entidades do MVP

### `Usuario`

Herda `id`, `nome` e `email` de `Pessoa` e acrescenta `senhaHash`, `papel` e `ativo`.

### `Cliente`

Herda `id`, `nome` e `email` de `Pessoa` e acrescenta `telefone` e `criadoEm`.

### `OrdemServico`

Possui `id`, `codigo`, `cliente`, `descricaoServico`, `valor`, `dataEntrada`, `dataPrevistaEntrega`, `status` e `criadoEm`.

## Associação entre objetos

`OrdemServico` possui uma referência a `Cliente`. No banco, isso se torna a coluna `cliente_id`, uma chave estrangeira obrigatória. O Service só cria uma OS se a cliente existir, e a exclusão da cliente é bloqueada quando há OS vinculada.

## Enums e loops simples

`StatusOrdem` representa `PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDA` e `CANCELADA`. A conversão usa um `for` simples e `equalsIgnoreCase`.

Os Services convertem entidades em DTOs com `ArrayList` e `for`, sem streams ou lambdas desnecessários.

## Controllers e Services

- `AutenticacaoController` e `AutenticacaoService`: login, sessão e logout.
- `ClienteController` e `ClienteService`: CRUD de clientes.
- `OrdemServicoController` e `OrdemServicoService`: CRUD de OS.
- `SaudeController`: health check da infraestrutura.

`@Transactional` garante que a operação e seus relacionamentos sejam confirmados juntos.

## DTOs e validação

- `ClienteRequest`: nome, telefone e email recebidos.
- `ClienteResponse`: dados devolvidos com ID string e data de criação.
- `OrdemServicoRequest`: cliente, descrição, valor, datas e status.
- `OrdemServicoResponse`: dados completos da OS.

IDs são strings para compatibilidade com o frontend. Valores usam `BigDecimal`, evitando erros comuns de arredondamento de `double` em dinheiro.

## Segurança

O login usa `BCryptPasswordEncoder.matches`. A senha persistida é apenas o hash. A sessão usa cookie HttpOnly; o frontend consulta a identidade atual pela API e não armazena a senha.

## Testes

- `MvpIntegrationTest`: autenticação, CRUD de clientes, CRUD de OS, relacionamento e validações.
- `PessoaTest`: herança, abstração, polimorfismo e sobrescrita.

Resultado atual: **7 testes, 0 falhas**. O E2E percorre os formulários no Edge e remove seus registros ao final.

## Como apresentar

1. Mostre `Pessoa` como classe abstrata.
2. Mostre `Cliente` e `Usuario` herdando os campos comuns.
3. Aponte `getTipoPessoa()` com `@Override`.
4. Explique o polimorfismo com uma referência `Pessoa`.
5. Mostre `OrdemServico` associada a `Cliente`.
6. Mostre loops e condições simples nos Services.
7. Execute os testes e faça uma operação CRUD no frontend.
