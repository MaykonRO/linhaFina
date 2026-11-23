# Acompanhamento da implementação

Registro atualizado conforme as fases são executadas. Uma fase só é marcada como concluída depois de sua verificação.

## FASE 0 — Auditoria e planejamento

**Situação: concluída.**

- Frontend auditado: HTML/CSS/JavaScript ES puro, sem React e sem banco local.
- Fluxo confirmado: páginas → store → módulos de API → `httpClient` → Spring Boot.
- Foram mapeados payloads, respostas, IDs string, listas não paginadas e ações assíncronas.
- Referência <https://github.com/MaykonRO/fatec.poo.aulas> clonada e examinada.
- Relatório: `docs/auditoria-aulas.md`.

## FASE 1 — Ambiente e estrutura Java

**Situação: concluída.**

- Eclipse Temurin JDK `21.0.13.1+2` LTS, portátil.
- Apache Maven `3.9.11`, portátil.
- Spring Boot `3.5.7`; Web, Data JPA, Validation e driver PostgreSQL.
- Estrutura `backend/` criada sem Lombok, MapStruct ou H2.
- `mvn clean compile`: **BUILD SUCCESS**, 41 arquivos Java compilados.

## FASE 2 — PostgreSQL e modelagem

**Situação: concluída.**

- PostgreSQL `17.6` portátil, executando em `localhost:5432`.
- Bancos reais `linhafina` e `linhafina_test` criados e conexão validada.
- Credencial aleatória local somente em arquivos ignorados pelo Git.
- Modelos iniciais: herança Pessoa/Cliente/Funcionaria, ficha de medidas, serviço, OS e pagamento.
- `BigDecimal` para dinheiro; `LocalDate`/`LocalDateTime` para datas.

## FASE 3 — Herança e orientação a objetos

**Situação: concluída e testada.**

- `@Inheritance(strategy = JOINED)` em `Pessoa`.
- `extends`, `super()`, encapsulamento, construtores e `@Override` aplicados.
- Polimorfismo verificável por `PessoaRepository` e `List<Pessoa>`.

## FASES 4 e 5 — CRUDs do núcleo

**Situação: concluídos e testados.**

- `mvn test`: **7 testes, 0 falhas, 0 erros, 0 ignorados**.
- Banco usado nos testes: PostgreSQL 17.6, `linhafina_test`.
- Verificado: CRUDs, validações, herança JOINED, polimorfismo, relacionamentos, urgência, fluxo de status, cancelamento e pagamento.

- Clientes: CRUD, cadastro rápido e ficha de medidas.
- Serviços: CRUD, ativação/desativação e proteção do histórico.
- Funcionárias: CRUD necessário ao vínculo da OS.
- OS: criação/listagem/consulta/edição, avanço, cancelamento com motivo e pagamento.
- Cálculo de taxa de urgência e valor final no backend.

## FASE 6 — Integração com frontend

**Situação: núcleo concluído e testado no navegador.**

- `front/js/config-api.js` configura apenas os endpoints implementados, usando o `httpClient` existente.
- Corrigida a montagem do rótulo do combobox de cliente na OS.
- Fluxo E2E no Edge: criação de cliente, serviço, ativação/desativação, funcionária, OS urgente e avanço de status.
- Resultado: 0 erros de console, 0 `pageerror`, 0 violações axe e sem overflow horizontal.
- Registros E2E removidos ao final; contagens de pessoas, serviços e OS voltaram a zero.

## FASE 7 — Regras de negócio

**Situação: concluída e testada, inclusive no navegador.**

- Horas estimadas, capacidade diária, fila geral/individual e prioridade de urgência.
- Resposta com OSs impactadas pela recalculação dos prazos.
- Configurações persistidas por seção: ateliê, horários, folgas, taxa, fidelidade, notificações e interface.
- Folgas e dias explicitamente fechados são pulados; provas incompatíveis são rejeitadas.
- Suíte: **12 testes, 0 falhas, 0 erros** no PostgreSQL `linhafina_test`.
- Um teste foi corrigido após expectativa incorreta: serviço de 8h iniciado em dia útil termina no mesmo dia; a folga de amanhã só afeta carga que atravessa esse dia.
- E2E da prévia: data calculada e exibida antes da gravação; 0 erros de console, 0 violações axe.

## FASE 8 — Funcionalidades complementares

**Situação: concluída e testada.**

- Login por sessão HttpOnly, BCrypt e papéis em implementação/teste.
- Restauração da sessão entre páginas e logout HTTP integrados no frontend.
- Credencial inicial apenas em `backend/.env`, sem seed fixo no código.
- Suíte com segurança: **15 testes, 0 falhas, 0 erros**.
- E2E autenticação: rota protegida, senha inválida 401, login, sessão entre páginas, logout 204 e bloqueio após saída; 0 erros inesperados.
- Orçamentos e vitrine: **20 testes Java, 0 falhas, 0 erros**.
- E2E orçamento: criação, aprovação e conversão em OS real com valor correto.
- E2E vitrine: cadastro, destaque, ocultação e galeria pública sem APIs administrativas/inativas.
- CRUD autenticado completo: 0 erros inesperados, 0 violações axe; 401 anterior ao login registrado separadamente.
- Upload multipart: backend e E2E aprovados; PNG de 68 bytes enviado e recuperado, sem erros de navegador.
- Taxa de guarda, bloqueio por pendências e fidelidade: **26 testes Java, 0 falhas, 0 erros**.
- Relatórios/PDF e remarcação de prova: validados.
- Contrato completo de pagamentos: listagem e registro reutilizando a regra da OS.
- Suíte final: **31 testes Java, 0 falhas, 0 erros, 0 ignorados**.
- E2Es finais aprovados: autenticação, núcleo/PDF, orçamento/vitrine/upload e configurações pela UI.

## FASE 9 — Testes completos

**Situação: concluída, incluindo empacotamento e execução pelo JAR.**

- 31 testes Java em 12 classes, todos aprovados no PostgreSQL real.
- Quatro scripts E2E no Edge aprovados, sem erros inesperados.
- 0 violações axe no núcleo e sem overflow horizontal.
- Registros E2E removidos; configuração padrão restaurada.
- `mvn clean package`: **BUILD SUCCESS**, 31 testes repetidos.
- JAR `backend/target/linha-fina-1.0.0.jar` iniciado; API pública, login `dono` e pagamentos autenticados verificados.

## FASE 10 — Documentação e entrega

**Situação: concluída.**

- `DOCUMENTACAO_JAVA.md`, `RELATORIO_FINAL.md` e `docs/schema-postgresql.sql` criados.
- READMEs atualizados para o estado full stack real.
- Pendências explicitadas: SMTP/e-mail, exportação CSV e tela de gestão de múltiplos usuários.
- Scripts `INICIAR.ps1` e `TESTAR.ps1` validados; segredos fora do Git.

