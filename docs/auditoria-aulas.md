# Auditoria do repositório de POO

Referência obrigatória: <https://github.com/MaykonRO/fatec.poo.aulas>.

O repositório foi clonado localmente em `.referencias/fatec.poo.aulas`, branch `main`, commit `5f57233ce45393ad9434464a1b8016ff9adf6a02`. Foram examinados os 55 arquivos `.java`, os dez `pom.xml`, o README e os arquivos de configuração relevantes. A pasta de referência é local e está fora do Git do Linha Fina.

## Conteúdos efetivamente encontrados

| Conteúdo | Evidência real nas aulas | Como será aplicado no Linha Fina |
|---|---|---|
| Classes e objetos | `aula1/.../Cachorro.java` e `MeuProjeto.java`: classe com estado e instâncias com `new` | Entidades como `Cliente`, `Servico` e `OrdemServico`; services criam e manipulam objetos reais |
| Atributos e métodos | `aula1/.../Contador.java`: atributo `quantidade` e operações de incremento/decremento | Atributos privados e comportamentos como `recalcularValorFinal()` |
| Encapsulamento | `aula3/.../Foo.java` e `Aluno.java`: visibilidade e getters/setters | Campos privados, acessores e validação antes de alterar entidades |
| Construtores e `this` | `aula2/.../Aluno.java`; `aula10-v-garcia/.../Cliente.java` | Construtores vazios exigidos pelo JPA e construtores que recebem dados do domínio |
| Herança e `super` | `aula8/.../Animal.java`, `Cachorro.java`, `Gato.java` | `Pessoa` como superclasse; `Cliente` e `Funcionaria` com `extends` e `super(...)` |
| Sobrescrita | `aula8/.../Cachorro.java` e `Gato.java`: `emitirSom` com `@Override` | `getTipoPessoa()` sobrescrito nas duas subclasses |
| Polimorfismo | `aula9/.../Main.java` e `PetShop.java`: referências e `ArrayList<Animal>` | `List<Pessoa>` com objetos `Cliente` e `Funcionaria`; chamada despachada para a implementação de cada subclasse |
| Interfaces | `aula9/.../Brincavel.java` e `Nadavel.java` | Contratos do Spring Data (`JpaRepository`) sem criar interfaces artificiais |
| Sobrecarga | `aula8/.../Foo.java`; construtores de `aula10-v-garcia/.../Cliente.java` | Construtores com assinaturas diferentes nas entidades |
| Associação | `aula4/.../Cliente.java` e `Main.java`: cliente associado a endereço | Cliente ↔ ficha de medidas; OS → cliente, serviço e funcionária |
| Enums e `switch` | `aula2/.../Curso.java` e `Aluno.java` | `StatusOrdem` e `StatusPagamento`, incluindo transição de etapas |
| Records | `aula2/.../NomeAluno.java`, `RaAluno.java` | Conceito identificado; DTOs foram mantidos como classes para praticar encapsulamento |
| Arrays e coleções | `aula5/.../Carrinho.java`: array; `aula6/.../Carrinho.java`: `ArrayList`, `HashMap`, for-each | `List` para coleções da API/filas e mapas para agregações de relatórios |
| Generics | `aula6/.../Tupla.java`; `correcaop1/.../Maybe.java` | Uso real em `JpaRepository<Entidade, Long>`, `List<T>` e `ResponseEntity<T>` |
| Membros `static` | `aula3/.../Sapo.java` | Constantes e fábricas de enum; não há contador global de dados de negócio |
| Camadas e injeção | `aula10-v-garcia/.../MenuController.java`, `ClienteService.java`, `ClienteDAO.java` | Controller REST → Service → Repository; injeção pelo construtor |
| Spring/PostgreSQL/testes | `aula10` e `aula10-v-garcia`: starters Web, PostgreSQL e `@SpringBootTest` | API REST, Spring Data JPA, PostgreSQL real e testes de regra/integração |

Os caminhos abreviados com `...` representam os pacotes `src/main/java` dentro de cada aula. O clone local permite abrir os arquivos completos durante o estudo.

## Decisões tomadas a partir da auditoria

1. **Não copiar o frontend das aulas.** A aula 10 usa MVC com Thymeleaf e Data JDBC; o Linha Fina já tem frontend em módulos ES e exige API REST com Spring Data JPA.
2. **Não criar uma hierarquia artificial.** `Pessoa → Cliente/Funcionaria` é especialização real e será usada nos CRUDs e no relacionamento de OS.
3. **Manter o código didático.** DTOs, entidades e serviços são classes comuns, sem Lombok/MapStruct e sem padrões adicionais desnecessários.
4. **Usar coleções em vez de arrays fixos.** O tamanho da fila e o histórico variam; `List` é a estrutura adequada.
5. **Não repetir credenciais do exemplo das aulas.** As senhas ficam somente em configuração local ignorada.

## Versões encontradas na referência

As aulas usam Java 17 e 21, Maven e, nos exemplos Web, Spring Boot 3.2.3 e 4.1.2. O Linha Fina utiliza Java 21 LTS e Spring Boot 3.5.7, mantendo compatibilidade com os conceitos, sem depender da versão exata de cada exemplo.

## Observação de leitura

Em `ex1`, métodos declarados como `public void Cartao(...)` e `public void Cliente(...)` **não são construtores**, pois construtores não possuem tipo de retorno. Eles não foram usados como evidência desse conteúdo.
