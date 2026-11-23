package br.com.linhafina.service;

import br.com.linhafina.dto.CancelamentoRequest;
import br.com.linhafina.dto.OrdemServicoRequest;
import br.com.linhafina.dto.OrdemServicoResponse;
import br.com.linhafina.dto.PagamentoRequest;
import br.com.linhafina.dto.PrazoImpactoResponse;
import br.com.linhafina.dto.PrevisaoPrazoResponse;
import br.com.linhafina.dto.ProvaRequest;
import br.com.linhafina.exception.RecursoNaoEncontradoException;
import br.com.linhafina.exception.RegraNegocioException;
import br.com.linhafina.model.OrdemServico;
import br.com.linhafina.model.Pagamento;
import br.com.linhafina.model.StatusOrdem;
import br.com.linhafina.model.StatusPagamento;
import br.com.linhafina.repository.OrdemServicoRepository;
import br.com.linhafina.repository.PagamentoRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrdemServicoService {

    private final OrdemServicoRepository ordemRepository;
    private final PagamentoRepository pagamentoRepository;
    private final ClienteService clienteService;
    private final ServicoService servicoService;
    private final FuncionariaService funcionariaService;
    private final PrazoService prazoService;
    private final ConfiguracaoService configuracaoService;
    private final BigDecimal taxaGuardaDia;
    private final int diasToleranciaRetirada;
    private final boolean bloqueioPendencias;

    public OrdemServicoService(
            OrdemServicoRepository ordemRepository,
            PagamentoRepository pagamentoRepository,
            ClienteService clienteService,
            ServicoService servicoService,
            FuncionariaService funcionariaService,
            PrazoService prazoService,
            ConfiguracaoService configuracaoService,
            @Value("${atelie.taxa-guarda-dia:5}") BigDecimal taxaGuardaDia,
            @Value("${atelie.dias-tolerancia-retirada:2}") int diasToleranciaRetirada,
            @Value("${atelie.bloqueio-pendencias:false}") boolean bloqueioPendencias) {
        this.ordemRepository = ordemRepository;
        this.pagamentoRepository = pagamentoRepository;
        this.clienteService = clienteService;
        this.servicoService = servicoService;
        this.funcionariaService = funcionariaService;
        this.prazoService = prazoService;
        this.configuracaoService = configuracaoService;
        this.taxaGuardaDia = taxaGuardaDia;
        this.diasToleranciaRetirada = diasToleranciaRetirada;
        this.bloqueioPendencias = bloqueioPendencias;
    }

    @Transactional(readOnly = true)
    public List<OrdemServicoResponse> listar() {
        return ordemRepository.findAll().stream()
                .sorted(Comparator.comparing(OrdemServico::getCriadoEm).reversed())
                .map(OrdemServicoResponse::new).toList();
    }

    @Transactional(readOnly = true)
    public OrdemServicoResponse obter(Long id) {
        return new OrdemServicoResponse(buscar(id));
    }

    @Transactional
    public OrdemServicoResponse criar(OrdemServicoRequest request) {
        verificarPendencias(Long.valueOf(request.getClienteId()));
        OrdemServico os = new OrdemServico();
        os.setValorPago(BigDecimal.ZERO);
        os.setPagamentoStatus(StatusPagamento.PENDENTE);
        aplicarDados(os, request, true);
        ordemRepository.save(os);
        List<PrazoImpactoResponse> impactos = prazoService.recalcularFila(os);
        OrdemServicoResponse response = new OrdemServicoResponse(os);
        response.setImpactosPrazo(impactos);
        return response;
    }

    @Transactional
    public OrdemServicoResponse atualizar(Long id, OrdemServicoRequest request) {
        OrdemServico os = buscar(id);
        if (os.getStatus() == StatusOrdem.CANCELADA || os.getStatus() == StatusOrdem.ENTREGUE) {
            throw new RegraNegocioException("Uma OS entregue ou cancelada nao pode ser editada.");
        }
        aplicarDados(os, request, false);
        if (os.getValorPago().compareTo(os.getValorFinal()) > 0) {
            throw new RegraNegocioException("O novo valor final nao pode ser menor que o valor ja pago.");
        }
        ordemRepository.save(os);
        List<PrazoImpactoResponse> impactos = List.of();
        if (os.getStatus() == StatusOrdem.AGUARDANDO || os.getStatus() == StatusOrdem.PRODUCAO || os.getStatus() == StatusOrdem.PROVA) {
            impactos = prazoService.recalcularFila(os);
        }
        OrdemServicoResponse response = new OrdemServicoResponse(os);
        response.setImpactosPrazo(impactos);
        return response;
    }

    @Transactional
    public OrdemServicoResponse avancarStatus(Long id) {
        OrdemServico os = buscar(id);
        if (os.getStatus() == StatusOrdem.PROVA && os.getSobMedida() && !Boolean.TRUE.equals(os.getProvaComparecida())) {
            throw new RegraNegocioException("Registre o comparecimento da prova antes de avancar esta OS sob medida.");
        }
        StatusOrdem proximo = os.getStatus().proximo();
        os.setStatus(proximo);
        if (proximo == StatusOrdem.PRONTA && os.getDataPronta() == null) os.setDataPronta(LocalDate.now());
        if (proximo == StatusOrdem.ENTREGUE) {
            os.setDataEntrega(LocalDate.now());
            if (os.getDataPronta() == null) os.setDataPronta(LocalDate.now());
            calcularTaxaGuarda(os);
        }
        return new OrdemServicoResponse(ordemRepository.save(os));
    }

    @Transactional
    public OrdemServicoResponse registrarProva(Long id, ProvaRequest request) {
        OrdemServico os = buscar(id);
        if (os.getStatus() != StatusOrdem.PROVA) {
            throw new RegraNegocioException("A OS precisa estar aguardando prova.");
        }
        if (request.getCompareceu()) {
            os.setProvaComparecida(true);
            os.setStatus(StatusOrdem.PRONTA);
            os.setDataPronta(LocalDate.now());
            return new OrdemServicoResponse(ordemRepository.save(os));
        }

        LocalDate novaData = request.getNovaDataProva();
        if (novaData == null || novaData.isBefore(LocalDate.now())) {
            throw new RegraNegocioException("Informe uma nova data de prova, hoje ou no futuro.");
        }
        if (prazoService.diaFechado(novaData)) {
            throw new RegraNegocioException("A nova prova nao pode ser marcada em uma folga.");
        }
        os.setProvaComparecida(false);
        os.setDataProva(novaData);
        os.setDataPrevistaEntrega(prazoService.previsaoAposFalta(os, novaData));
        return new OrdemServicoResponse(ordemRepository.save(os));
    }

    @Transactional
    public OrdemServicoResponse cancelar(Long id, CancelamentoRequest request) {
        OrdemServico os = buscar(id);
        if (os.getStatus() == StatusOrdem.ENTREGUE || os.getStatus() == StatusOrdem.CANCELADA) {
            throw new RegraNegocioException("Esta OS nao pode mais ser cancelada.");
        }
        os.setStatus(StatusOrdem.CANCELADA);
        os.setMotivoCancelamento(request.getMotivo().trim());
        return new OrdemServicoResponse(ordemRepository.save(os));
    }

    @Transactional
    public OrdemServicoResponse registrarPagamento(Long id, PagamentoRequest request) {
        OrdemServico os = buscar(id);
        if (os.getStatus() == StatusOrdem.CANCELADA) {
            throw new RegraNegocioException("Nao e possivel registrar pagamento em uma OS cancelada.");
        }

        StatusPagamento desejado = StatusPagamento.deTexto(request.getStatus());
        BigDecimal novoTotal;
        if (desejado == StatusPagamento.PAGO) {
            novoTotal = os.getValorFinal();
        } else if (desejado == StatusPagamento.PENDENTE) {
            if (os.getValorPago().compareTo(BigDecimal.ZERO) > 0) {
                throw new RegraNegocioException("Uma OS com pagamentos nao pode voltar para pendente.");
            }
            novoTotal = BigDecimal.ZERO;
        } else {
            // No formulario, o valor parcial representa o total pago acumulado.
            novoTotal = request.getValorPago();
            if (novoTotal.compareTo(os.getValorPago()) <= 0) {
                throw new RegraNegocioException("O total parcial deve ser maior que o valor ja pago.");
            }
            if (novoTotal.compareTo(os.getValorFinal()) >= 0) {
                throw new RegraNegocioException("No pagamento parcial, o total deve ser menor que o valor final.");
            }
        }

        BigDecimal valorDaBaixa = novoTotal.subtract(os.getValorPago());
        if (valorDaBaixa.compareTo(BigDecimal.ZERO) > 0) {
            pagamentoRepository.save(new Pagamento(os, valorDaBaixa, LocalDate.now()));
        }
        os.setValorPago(novoTotal);
        os.setPagamentoStatus(desejado);
        os.setDataPagamento(LocalDate.now());
        return new OrdemServicoResponse(ordemRepository.save(os));
    }

    @Transactional(readOnly = true)
    public PrevisaoPrazoResponse preverPrazo(OrdemServicoRequest request) {
        OrdemServico os = new OrdemServico();
        os.setValorPago(BigDecimal.ZERO);
        os.setPagamentoStatus(StatusPagamento.PENDENTE);
        aplicarDados(os, request, true);
        return prazoService.previsualizar(os);
    }

    @Transactional(readOnly = true)
    public OrdemServico buscar(Long id) {
        return ordemRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Ordem de servico nao encontrada."));
    }

    private void aplicarDados(OrdemServico os, OrdemServicoRequest request, boolean criando) {
        os.setCliente(clienteService.buscar(Long.valueOf(request.getClienteId())));
        var servico = servicoService.buscar(Long.valueOf(request.getServicoId()));
        if (criando && !servico.getAtivo()) throw new RegraNegocioException("Selecione um servico ativo.");
        os.setServico(servico);

        if (request.getResponsavelId() == null || request.getResponsavelId().isBlank()) {
            os.setResponsavel(null);
        } else {
            var funcionaria = funcionariaService.buscar(Long.valueOf(request.getResponsavelId()));
            if ("afastada".equals(funcionaria.getStatus())) {
                throw new RegraNegocioException("A funcionaria selecionada esta afastada.");
            }
            os.setResponsavel(funcionaria);
        }

        os.setTipoPeca(request.getTipoPeca().trim());
        os.setDescricaoPeca(request.getDescricaoPeca().trim());
        os.setObservacoes(request.getObservacoes() == null ? "" : request.getObservacoes().trim());
        os.setSobMedida(Boolean.TRUE.equals(request.getSobMedida()));
        os.setAjuste(Boolean.TRUE.equals(request.getAjuste()));
        os.setUrgente(Boolean.TRUE.equals(request.getUrgente()));
        os.setValorServico(request.getValorServico());
        os.setDesconto(request.getDesconto() == null ? BigDecimal.ZERO : request.getDesconto());
        if (criando && os.getDesconto().compareTo(BigDecimal.ZERO) == 0) aplicarDescontoFidelidade(os);
        os.setTaxaUrgencia(calcularTaxa(os));
        os.recalcularValorFinal();
        if (os.getValorFinal().compareTo(BigDecimal.ZERO) <= 0) {
            throw new RegraNegocioException("O valor final da OS deve ser maior que zero.");
        }

        StatusOrdem novoStatus = StatusOrdem.deTexto(request.getStatus() == null ? "aguardando" : request.getStatus());
        if (novoStatus == StatusOrdem.CANCELADA) {
            throw new RegraNegocioException("Use a acao de cancelamento para informar o motivo.");
        }
        if (criando && novoStatus != StatusOrdem.AGUARDANDO) {
            throw new RegraNegocioException("Uma nova OS deve comecar como aguardando.");
        }
        os.setStatus(novoStatus);
        if (novoStatus == StatusOrdem.PRONTA && os.getDataPronta() == null) os.setDataPronta(LocalDate.now());
        os.setDataEntrada(request.getDataEntrada());
        if (novoStatus == StatusOrdem.AGUARDANDO || novoStatus == StatusOrdem.PRODUCAO || novoStatus == StatusOrdem.PROVA) {
            PrevisaoPrazoResponse previsao = prazoService.previsualizar(os);
            os.setDataPrevistaEntrega(previsao.getDataPrevistaEntrega());
        }
        os.setDataProva(request.getDataProva());
        validarProva(os);
        if (novoStatus == StatusOrdem.ENTREGUE && os.getDataEntrega() == null) os.setDataEntrega(LocalDate.now());
    }

    private void verificarPendencias(Long clienteId) {
        if (!bloqueioPendencias) return;
        List<OrdemServico> historico = ordemRepository.findByClienteIdOrderByDataEntradaDesc(clienteId);
        boolean pagamentoPendente = historico.stream().anyMatch(os ->
                os.getStatus() == StatusOrdem.ENTREGUE && os.getPagamentoStatus() != StatusPagamento.PAGO);
        if (pagamentoPendente) {
            throw new RegraNegocioException("A cliente possui pagamento pendente em uma OS entregue. Regularize antes de abrir outra OS.");
        }
        boolean retiradaPendente = historico.stream().anyMatch(os -> os.getStatus() == StatusOrdem.PRONTA);
        if (retiradaPendente) {
            throw new RegraNegocioException("A cliente possui uma peca pronta para retirada. Conclua a entrega antes de abrir outra OS.");
        }
    }

    private void aplicarDescontoFidelidade(OrdemServico os) {
        Map<String, Object> regra = configuracaoService.obterFidelidade();
        if (!Boolean.TRUE.equals(regra.get("ativo"))) return;
        if (!(regra.get("descontoPercentual") instanceof Number percentual)
                || !(regra.get("servicosNecessarios") instanceof Number necessarios)
                || necessarios.intValue() <= 0) return;
        long entregues = ordemRepository.countByClienteIdAndStatus(os.getCliente().getId(), StatusOrdem.ENTREGUE);
        if (entregues < necessarios.intValue() || entregues % necessarios.intValue() != 0) return;
        BigDecimal desconto = os.getValorServico()
                .multiply(new BigDecimal(percentual.toString()))
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
        os.setDesconto(desconto);
    }

    private void calcularTaxaGuarda(OrdemServico os) {
        if (os.getDataPronta() == null || os.getDataEntrega() == null) return;
        long diasAtraso = ChronoUnit.DAYS.between(
                os.getDataPronta().plusDays(diasToleranciaRetirada), os.getDataEntrega());
        BigDecimal taxa = diasAtraso > 0
                ? taxaGuardaDia.multiply(BigDecimal.valueOf(diasAtraso)).setScale(2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO.setScale(2);
        os.setTaxaGuarda(taxa);
        os.recalcularValorFinal();
    }

    private BigDecimal calcularTaxa(OrdemServico os) {
        if (!os.getUrgente()) return BigDecimal.ZERO.setScale(2);
        return os.getValorServico().multiply(configuracaoService.obterTaxaUrgenciaPadrao())
                .divide(new BigDecimal("100"), 2, RoundingMode.HALF_UP);
    }

    private void validarProva(OrdemServico os) {
        LocalDate prova = os.getDataProva();
        if (os.getSobMedida() && prova == null) {
            throw new RegraNegocioException("Informe a data da prova intermediaria para confeccao sob medida.");
        }
        if (prova == null) return;
        if (prova.isBefore(os.getDataEntrada()) || prova.isAfter(os.getDataPrevistaEntrega())) {
            throw new RegraNegocioException("A prova deve estar entre a entrada e a previsao de entrega.");
        }
        if (prazoService.diaFechado(prova)) {
            throw new RegraNegocioException("A prova nao pode ser agendada em um dia de folga do atelie.");
        }
    }
}
