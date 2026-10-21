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
## Funcionalidades descartadas
 
- **Controle de estoque de tecido/aviamento** — complexidade desnecessária para o porte de uma costureira pequena/autônoma; faz mais sentido para ateliês de grande porte
## Stack
 
- **Back-end:** Java
- **Front-end:** a definir
- **Persistência:** banco de dados via servidor (a definir)
## Equipe
 
Projeto desenvolvido em dupla.
