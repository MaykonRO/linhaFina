# Conceitos de Java e POO — Linha Fina MVP

Este documento mostra onde os conceitos estudados aparecem no backend e como explicá-los em uma apresentação.

## 1. Classe, objeto, atributo e método

Uma **classe** é um modelo. Um **objeto** é uma instância concreta dessa classe.

```java
Cliente cliente = new Cliente();
cliente.setNome("Maria");
```

- `Cliente` é a classe.
- `new Cliente()` cria o objeto e chama um construtor.
- `cliente` é a referência ao objeto.
- `nome` é um atributo.
- `setNome()` é um método.

Outras classes do projeto são `Usuario`, `OrdemServico`, `Pessoa`, DTOs, Services e Controllers.

## 2. Encapsulamento

Os atributos são `private`. O acesso acontece por getters e setters.

```java
private String nome;

public String getNome() {
    return nome;
}

public void setNome(String nome) {
    this.nome = nome;
}
```

**Onde está:** `Pessoa`, `Cliente`, `Usuario`, `OrdemServico` e DTOs.

**Como explicar:** os dados ficam protegidos dentro do objeto; outras classes usam a interface pública em vez de alterar os campos diretamente.

## 3. Construtores e `this`

Construtores inicializam os objetos. O JPA usa o construtor vazio para criar entidades durante as consultas.

```java
public Cliente(String nome, String telefone, String email) {
    super(nome, email);
    this.telefone = telefone;
}
```

- `super(...)` chama o construtor da classe base.
- `this.telefone` é o atributo do objeto.
- `telefone`, sem `this`, é o parâmetro recebido.

**Onde está:** `Pessoa`, `Cliente`, `Usuario`, DTOs e Services.

## 4. Herança

`Cliente` e `Usuario` herdam de `Pessoa`. A classe base guarda `id`, `nome` e `email`, evitando repetição.

```java
public class Cliente extends Pessoa {
    private String telefone;
}

public class Usuario extends Pessoa {
    private String senhaHash;
}
```

`Cliente` também tem `telefone` e `criadoEm`; `Usuario` também tem `senhaHash`, `papel` e `ativo`.

**Onde está:**
- `model/Pessoa.java`
- `model/Cliente.java`
- `model/Usuario.java`

**Como explicar:** `Cliente` é uma `Pessoa` e `Usuario` é uma `Pessoa`. As filhas reutilizam os campos e métodos comuns e acrescentam seus próprios dados.

## 5. Abstração

`Pessoa` é abstrata e não pode ser instanciada diretamente. Ela define o método `getTipoPessoa()`, que cada filha precisa implementar.

```java
public abstract class Pessoa {
    public abstract String getTipoPessoa();
}
```

A abstração concentra o que é comum e deixa os detalhes para as classes concretas.

**Como explicar:** existe o conceito genérico de pessoa, mas o sistema trabalha com objetos concretos de cliente e usuário.

## 6. Sobrescrita

As filhas implementam o método abstrato usando `@Override`.

```java
@Override
public String getTipoPessoa() {
    return "cliente";
}
```

Em `Usuario`, o mesmo método retorna `"usuario"`.

**Como explicar:** a assinatura é a mesma da classe base, mas cada filha fornece sua implementação. `@Override` também permite ao compilador avisar se a assinatura estiver errada.

## 7. Polimorfismo

Uma referência do tipo `Pessoa` pode apontar para `Cliente` ou `Usuario`. O método chamado é o da classe real do objeto.

```java
Pessoa pessoa = new Cliente("Maria", "11999999999", "maria@teste.local");
System.out.println(pessoa.getTipoPessoa()); // cliente
```

`Pessoa.toString()` também chama `getTipoPessoa()`. Por isso, uma referência `Pessoa` produz resultados diferentes conforme o objeto real.

```java
Pessoa cliente = new Cliente("Maria", "11999999999", "maria@teste.local");
Pessoa usuario = new Usuario("Admin", "admin@teste.local", "hash", Papel.DONO);

System.out.println(cliente.toString()); // cliente: Maria
System.out.println(usuario.toString()); // usuario: Admin
```

**Como comprovar:** `PessoaTest` verifica essas saídas e o uso de `Pessoa` como tipo das referências.

## 8. Herança sem tabela extra

`Pessoa` usa `@MappedSuperclass`, não `@Entity`.

```java
@MappedSuperclass
public abstract class Pessoa {
    // id, nome e email herdados
}
```

O Hibernate copia os campos da classe base para as tabelas das filhas. Por isso o banco continua com apenas:

- `usuarios`
- `clientes`
- `ordens_servico`

Não existe uma tabela `pessoas`. A herança melhora o código sem complicar o banco.

## 9. Associação entre objetos

`OrdemServico` possui uma referência a `Cliente`:

```java
@ManyToOne(fetch = FetchType.LAZY, optional = false)
@JoinColumn(name = "cliente_id", nullable = false)
private Cliente cliente;
```

No banco, isso se torna a chave estrangeira `cliente_id`. O Service verifica se a cliente existe e impede sua exclusão quando há OS vinculada.

## 10. Enum e condições simples

`StatusOrdem` representa `PENDENTE`, `EM_ANDAMENTO`, `CONCLUIDA` e `CANCELADA`.

A conversão do texto usa um `for` simples:

```java
for (StatusOrdem status : values()) {
    if (status.name().equalsIgnoreCase(texto.trim())) {
        return status;
    }
}
```

**Como explicar:** o enum limita os valores possíveis, e o loop procura o status correspondente sem streams ou lambdas.

## 11. Estrutura em camadas

- `controller`: recebe as requisições HTTP.
- `service`: aplica validações e regras.
- `repository`: acessa o PostgreSQL com Spring Data JPA.
- `model`: entidades, herança e enums.
- `dto`: objetos de entrada e saída JSON.
- `config`: segurança, CORS e administrador inicial.

Exemplo de listagem com loop simples:

```java
List<ClienteResponse> resposta = new ArrayList<>();
for (Cliente cliente : clientes) {
    resposta.add(new ClienteResponse(cliente));
}
return resposta;
```

## 12. Autenticação e segurança

O login usa `BCryptPasswordEncoder.matches`. A senha persistida é apenas o hash. A sessão usa cookie HttpOnly.

A configuração do Spring Security usa a DSL do framework; isso é necessário para declarar regras de acesso e não é uma abstração criada pelo projeto.

## 13. Como apresentar ao professor

1. Mostre `Pessoa` como classe abstrata com atributos privados.
2. Mostre `Cliente extends Pessoa` e `Usuario extends Pessoa`.
3. Aponte o método abstrato `getTipoPessoa()` e as implementações com `@Override`.
4. Crie uma referência `Pessoa` apontando para `Cliente` e explique o polimorfismo.
5. Mostre `PessoaTest` comprovando os retornos diferentes.
6. Explique que `@MappedSuperclass` herda os campos sem criar tabela extra.
7. Mostre `OrdemServico` associada a `Cliente` e a chave estrangeira.
8. Mostre um loop simples em um Service e um `if` de validação.
9. Execute os testes e faça uma operação CRUD no frontend.

## 14. Verificação automatizada

- `PessoaTest`: herança, abstração, polimorfismo e sobrescrita.
- `MvpIntegrationTest`: login, logout, CRUD de clientes, CRUD de OS, relacionamento e validações.

O frontend continua usando os mesmos endpoints e formatos JSON; a simplificação foi feita apenas na implementação Java.
