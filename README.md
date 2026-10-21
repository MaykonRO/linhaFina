# Linha Fina
 
Sistema de gestão para ateliê de costura — ajustes e peças sob medida.
 
Projeto acadêmico (Fatec) em Java, com back-end e front-end integrados via servidor, banco de dados e operações CRUD. Desenvolvido em dupla. Entrega: **26/11/2026**.
 
## Sobre o projeto
 
O **Linha Fina** nasce da rotina de um ateliê de costura: uma cliente chega com uma peça para ajustar ou pede uma confecção sob medida, e tudo começa com a abertura de uma **Ordem de Serviço (OS)**. A partir desse núcleo, o sistema evolui para automatizar regras reais do dia a dia de uma costureira — como calcular prazos de entrega considerando a fila de serviços pendentes, lidar com pedidos urgentes, folgas do ateliê e muito mais.
 
## Funcionalidade principal (núcleo)
 
A entrega mínima e mais urgente do projeto:
 
- **CRUD de Ordem de Serviço** — criar, listar, editar e excluir/cancelar uma OS (cliente, tipo de serviço, descrição da peça, valor, status, datas)
- Cadastros de apoio: **Cliente** e **Serviço** (também com CRUD completo)
Esse núcleo sozinho já garante um sistema funcional e aprovável. As funcionalidades abaixo são incrementos construídos por cima dele.
 
## Funcionalidades auxiliares (ordem sugerida de implementação)
 
Ordenadas pelo impacto e nível de interesse em desenvolver — da mais desafiadora/divertida para a mais simples:
 
### 🔥 Alto impacto
1. **Cálculo automático de prazo de entrega** — soma a fila de OSs pendentes para sugerir a data de entrega (o diferencial do projeto, inspirado em lógica de escalonamento)
2. **Pedido urgente** — fura a fila, cobra taxa percentual extra e avisa quais prazos já combinados serão impactados
3. **Dias de folga/funcionamento do ateliê** — cadastro de dias sem expediente; o cálculo de prazo pula automaticamente esses dias
4. **Múltiplas costureiras/funcionárias** — cada OS pode ser atribuída a uma pessoa específica; a fila de capacidade passa a ser calculada por funcionária
5. **Login com níveis de acesso** — perfis de **Dono, Admin, Líder, Funcionário e Atendimento**, cada um com permissões diferentes
6. **Orçamento prévio** — cliente solicita um orçamento antes de virar OS; fluxo de estados (orçamento → aprovado → OS)
7. **Vitrine** — galeria pública de peças prontas, estilo portfólio, para divulgação do ateliê
### ⚙️ Impacto médio
8. **Prova intermediária agendada** — obrigatória na confecção sob medida; recalcula o prazo se o cliente faltar
9. **Agenda/calendário visual de entregas** — visualização por dia/semana da fila de OSs
10. **Taxa de guarda** — cobrança por atraso na retirada de peça pronta
11. **Bloqueio de nova OS por pendência** — cliente com pendência (financeira ou peça não retirada) não abre novo pedido
12. **Cancelamento de OS com motivo** — registra o porquê do cancelamento, para uso em relatórios futuros
13. **Cliente recorrente/fidelidade** — desconto automático a partir de X serviços realizados
14. **Relatório de faturamento** — total recebido e a receber por período (dia/semana/mês)
15. **Ranking dos serviços mais pedidos** — relatório dos tipos de ajuste/confecção mais comuns
16. **Exportar OS em PDF** — gera um comprovante/recibo da ordem de serviço
### 🧩 Baixo impacto
17. **Ficha de medidas do cliente** — cadastrada uma vez e reaproveitada automaticamente em novas OSs
18. **Pagamento (CRUD simples)** — registra se o serviço foi pago ou não, sem integração com API de pagamento real
19. **Histórico de peças/OSs do cliente** — consulta de todas as OSs anteriores de um cliente
20. **Notificação por e-mail** — envio automático ao cliente quando a OS muda de status (ex.: "pronta para retirada")
## Detalhamento das funcionalidades
 
Abaixo, cada funcionalidade é quebrada em sub-tarefas necessárias para implementá-la. O nível de detalhe acompanha o impacto: as de alto impacto têm o passo a passo mais fino (são o foco do projeto), as de baixo impacto ficam resumidas (vão para o fim da fila).
 
### 🔥 Alto impacto
 
**1. Cálculo automático de prazo de entrega**
- Definir tempo estimado (em horas) por tipo de serviço, cadastrado em `Servico`
- Ao criar uma OS, buscar todas as OSs pendentes (não entregues/não canceladas) ordenadas por data de entrada
- Somar o tempo estimado de todas as OSs na frente na fila
- Definir a capacidade de horas de trabalho por dia (ex.: 8h/dia) para converter "horas acumuladas" em "dias corridos"
- Calcular e salvar a data prevista de entrega da nova OS com base nesse acúmulo
- Exibir para o usuário, no momento da criação, a data sugerida antes de confirmar
- Tratar o caso de fila vazia (primeira OS, prazo = tempo estimado do próprio serviço)
**2. Pedido urgente**
- Adicionar campo `urgente` (booleano) na OS
- Definir percentual de taxa extra por urgência (fixo ou configurável)
- Ao marcar como urgente, recalcular a posição da OS na fila (vai para o início, antes das pendentes)
- Recalcular a data prevista de todas as OSs que estavam atrás na fila e que agora foram empurradas
- Gerar um aviso/lista das OSs cujo prazo mudou, para o usuário confirmar ciente do impacto
- Aplicar a taxa extra no valor final da OS urgente
**3. Dias de folga/funcionamento do ateliê**
- CRUD de `DiaDeFolga` (data específica) ou `DiaDaSemana` sem expediente (ex.: domingo)
- Função utilitária que, dado um intervalo de dias "corridos" calculado na funcionalidade 1, pula esses dias e empurra a data final
- Validar que não é possível agendar prova intermediária (funcionalidade 8) em dia de folga
- Tela/endpoint simples para cadastrar e listar os dias de folga
**4. Múltiplas costureiras/funcionárias**
- CRUD de `Funcionaria` (nome, papel/cargo — ver funcionalidade 5)
- Adicionar campo `funcionariaResponsavel` na OS
- Adaptar o cálculo de fila (funcionalidade 1) para somar apenas as OSs pendentes daquela funcionária específica, não do ateliê inteiro
- Decidir regra de atribuição: manual (quem está criando a OS escolhe) ou automática (quem tem menor fila no momento)
- Tela simples mostrando a carga de trabalho (fila) de cada funcionária
**5. Login com níveis de acesso (Dono, Admin, Líder, Funcionário, Atendimento)**
- Modelo de `Usuario` com campo de papel/role (enum: Dono, Admin, Líder, Funcionário, Atendimento)
- Tela de login (autenticação) com usuário/senha
- Hash de senha (ex.: BCrypt) — nunca salvar senha em texto puro
- Middleware/filtro de autorização que verifica o papel antes de liberar cada endpoint
- Definir matriz de permissões por papel (ex.: só Dono/Admin vê relatório de faturamento; Atendimento só cria/consulta OS; Funcionário só vê suas próprias OSs)
- Tela de gestão de usuários (CRUD, mas só acessível a Dono/Admin)
- Sessão/token (ex.: JWT, se API REST, ou sessão de servidor se MVC tradicional)
**6. Orçamento prévio**
- Modelo `Orcamento` (similar à OS, mas sem os campos de execução): cliente, descrição, valor estimado, status (Pendente, Aprovado, Recusado)
- CRUD de criação/listagem/edição de orçamento
- Ação "Aprovar orçamento" que converte automaticamente o orçamento em uma OS nova, copiando os dados
- Ação "Recusar orçamento" apenas muda o status, sem gerar OS
- Validação para não aprovar duas vezes o mesmo orçamento
**7. Vitrine**
- Modelo `PecaVitrine` (ou reaproveitar OS entregue + flag "exibir na vitrine")
- Upload de imagem da peça (salvar arquivo + referência no banco)
- Endpoint/tela pública (sem necessidade de login) que lista as peças marcadas para exibição
- Tela de administração para marcar/desmarcar uma OS entregue como "exibível" e escrever uma legenda curta
- Layout simples tipo grade de fotos (galeria)
### ⚙️ Impacto médio
 
**8. Prova intermediária agendada**
- Campo de data/hora da prova na OS (apenas para confecção sob medida)
- Marcar se o cliente compareceu ou não
- Se não compareceu: reabrir campo de nova data e recalcular o prazo final da OS (reaplicando a lógica da funcionalidade 1 a partir da nova data)
**9. Agenda/calendário visual de entregas**
- Endpoint que retorna as OSs agrupadas por data prevista de entrega
- Tela de calendário (semana/mês) mostrando quantas OSs vencem em cada dia
- Clicar no dia abre a lista de OSs daquele dia
**10. Taxa de guarda**
- Campo de data real de retirada (quando o cliente efetivamente pega a peça)
- Definir valor da taxa por dia de atraso e o prazo de tolerância (X dias após "pronta")
- Cálculo automático do valor da taxa ao registrar a retirada, se atrasada
**11. Bloqueio de nova OS por pendência**
- Verificação, ao abrir nova OS, se o cliente tem: OS com pagamento pendente OU peça pronta não retirada
- Bloquear a criação com mensagem explicando o motivo
- (Opcional) permitir que Dono/Admin libere manualmente uma exceção
**12. Cancelamento de OS com motivo**
- Campo `motivoCancelamento` (texto livre ou lista pré-definida) ao mudar status para "Cancelada"
- Exigir preenchimento do motivo antes de confirmar o cancelamento
**13. Cliente recorrente/fidelidade**
- Contar quantas OSs um cliente já teve com status "Entregue"
- Definir regra de desconto (ex.: a cada 5 serviços, 10% de desconto no próximo)
- Aplicar o desconto automaticamente no valor da nova OS quando a regra for atingida
**14. Relatório de faturamento**
- Query agregando valor total das OSs por período (filtro de data início/fim)
- Separar "recebido" (pago) de "a receber" (pendente), usando o CRUD de pagamento (funcionalidade 18)
- Tela simples com os totais e uma lista das OSs do período
**15. Ranking dos serviços mais pedidos**
- Query agrupando OSs por tipo de serviço, contando ocorrências
- Tela/lista ordenada do mais pedido para o menos pedido
**16. Exportar OS em PDF**
- Escolher biblioteca (ex.: iText ou Apache PDFBox)
- Template simples com os dados da OS (cliente, serviço, valor, datas, status)
- Botão/endpoint que gera o PDF a partir de uma OS existente
### 🧩 Baixo impacto
 
**17. Ficha de medidas do cliente**
- CRUD de `FichaDeMedidas` vinculada ao `Cliente` (campos: busto, cintura, quadril, comprimento etc.)
- Ao criar OS de confecção, puxar automaticamente a ficha mais recente do cliente (com opção de editar valores pontualmente para aquela OS)
**18. Pagamento (CRUD simples)**
- Campo `statusPagamento` na OS (enum: Pago, Não pago, Pago parcialmente — se quiserem incluir a entrada de 50%)
- Tela/endpoint para marcar como pago
**19. Histórico de peças/OSs do cliente**
- Endpoint que lista todas as OSs de um cliente específico, ordenadas por data
- Tela simples de consulta (filtro por cliente)
**20. Notificação por e-mail**
- Configurar `JavaMailSender`/Jakarta Mail com SMTP
- Disparar e-mail automático quando o status da OS muda para "Pronta" ou "Entregue"
- Template simples de texto (sem necessidade de HTML elaborado)

## Funcionalidades descartadas
 
- **Controle de estoque de tecido/aviamento** — complexidade desnecessária para o porte de uma costureira pequena/autônoma; faz mais sentido para ateliês de grande porte
## Stack
 
- **Back-end:** Java
- **Front-end:** a definir
- **Persistência:** banco de dados via servidor (a definir)
## Equipe
 
Projeto desenvolvido em dupla.
