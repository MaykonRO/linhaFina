package br.com.linhafina.service;

import br.com.linhafina.dto.OrcamentoRequest;
import br.com.linhafina.dto.OrcamentoResponse;
import br.com.linhafina.dto.OrdemServicoRequest;
import br.com.linhafina.dto.OrdemServicoResponse;
import br.com.linhafina.dto.RecusaOrcamentoRequest;
import br.com.linhafina.exception.RecursoNaoEncontradoException;
import br.com.linhafina.exception.RegraNegocioException;
import br.com.linhafina.model.Orcamento;
import br.com.linhafina.model.StatusOrcamento;
import br.com.linhafina.repository.OrcamentoRepository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrcamentoService {

    private final OrcamentoRepository orcamentoRepository;
    private final ClienteService clienteService;
    private final ServicoService servicoService;
    private final OrdemServicoService ordemService;

    public OrcamentoService(OrcamentoRepository orcamentoRepository, ClienteService clienteService,
                            ServicoService servicoService, OrdemServicoService ordemService) {
        this.orcamentoRepository = orcamentoRepository;
        this.clienteService = clienteService;
        this.servicoService = servicoService;
        this.ordemService = ordemService;
    }

    @Transactional
    public List<OrcamentoResponse> listar() {
        expirarVencidos();
        return orcamentoRepository.findAll().stream()
                .sorted(Comparator.comparing(Orcamento::getDataCriacao).reversed()
                        .thenComparing(Orcamento::getCodigo, Comparator.reverseOrder()))
                .map(OrcamentoResponse::new).toList();
    }

    @Transactional
    public OrcamentoResponse obter(Long id) {
        return new OrcamentoResponse(buscar(id));
    }

    @Transactional
    public OrcamentoResponse criar(OrcamentoRequest request) {
        Orcamento orcamento = new Orcamento();
        orcamento.setStatus(StatusOrcamento.PENDENTE);
        aplicarDados(orcamento, request);
        return new OrcamentoResponse(orcamentoRepository.save(orcamento));
    }

    @Transactional
    public OrcamentoResponse atualizar(Long id, OrcamentoRequest request) {
        Orcamento orcamento = buscar(id);
        if (orcamento.getStatus() != StatusOrcamento.PENDENTE && orcamento.getStatus() != StatusOrcamento.APROVADO) {
            throw new RegraNegocioException("Somente orcamentos pendentes ou aprovados podem ser editados.");
        }
        aplicarDados(orcamento, request);
        return new OrcamentoResponse(orcamentoRepository.save(orcamento));
    }

    @Transactional
    public OrcamentoResponse aprovar(Long id) {
        Orcamento orcamento = buscar(id);
        if (orcamento.getStatus() != StatusOrcamento.PENDENTE) {
            throw new RegraNegocioException("Somente um orcamento pendente pode ser aprovado.");
        }
        if (orcamento.getValidade().isBefore(LocalDate.now())) {
            orcamento.setStatus(StatusOrcamento.EXPIRADO);
            orcamentoRepository.save(orcamento);
            throw new RegraNegocioException("O orcamento esta vencido e nao pode ser aprovado.");
        }
        orcamento.setStatus(StatusOrcamento.APROVADO);
        return new OrcamentoResponse(orcamentoRepository.save(orcamento));
    }

    @Transactional
    public OrcamentoResponse recusar(Long id, RecusaOrcamentoRequest request) {
        Orcamento orcamento = buscar(id);
        if (orcamento.getStatus() != StatusOrcamento.PENDENTE && orcamento.getStatus() != StatusOrcamento.APROVADO) {
            throw new RegraNegocioException("Este orcamento nao pode ser recusado.");
        }
        orcamento.setStatus(StatusOrcamento.RECUSADO);
        orcamento.setMotivo(request.getMotivo() == null ? "" : request.getMotivo().trim());
        return new OrcamentoResponse(orcamentoRepository.save(orcamento));
    }

    @Transactional
    public OrdemServicoResponse converter(Long id) {
        Orcamento orcamento = buscar(id);
        if (orcamento.getStatus() != StatusOrcamento.APROVADO) {
            throw new RegraNegocioException("Aprove o orcamento antes de converter em OS.");
        }
        if (orcamento.getServico() == null) {
            throw new RegraNegocioException("Vincule um servico ao orcamento antes da conversao.");
        }

        OrdemServicoRequest request = new OrdemServicoRequest();
        request.setClienteId(String.valueOf(orcamento.getCliente().getId()));
        request.setServicoId(String.valueOf(orcamento.getServico().getId()));
        request.setResponsavelId("");
        request.setTipoPeca("A definir");
        request.setDescricaoPeca(orcamento.getDescricao());
        request.setObservacoes("Criada a partir do orcamento " + orcamento.getCodigo());
        request.setSobMedida(false);
        request.setAjuste(false);
        request.setUrgente(false);
        request.setValorServico(orcamento.getValorEstimado());
        request.setDesconto(BigDecimal.ZERO);
        request.setDataEntrada(LocalDate.now());
        request.setStatus("aguardando");

        OrdemServicoResponse novaOs = ordemService.criar(request);
        orcamento.setConvertidoOs(ordemService.buscar(Long.valueOf(novaOs.getId())));
        orcamento.setStatus(StatusOrcamento.CONVERTIDO);
        orcamentoRepository.save(orcamento);
        return novaOs;
    }

    @Transactional
    public Orcamento buscar(Long id) {
        Orcamento orcamento = orcamentoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Orcamento nao encontrado."));
        if (orcamento.getStatus() == StatusOrcamento.PENDENTE && orcamento.getValidade().isBefore(LocalDate.now())) {
            orcamento.setStatus(StatusOrcamento.EXPIRADO);
            orcamentoRepository.save(orcamento);
        }
        return orcamento;
    }

    private void aplicarDados(Orcamento orcamento, OrcamentoRequest request) {
        if (request.getValidade().isBefore(request.getDataCriacao())) {
            throw new RegraNegocioException("A validade nao pode ser anterior a criacao.");
        }
        orcamento.setCliente(clienteService.buscar(Long.valueOf(request.getClienteId())));
        if (request.getServicoId() == null || request.getServicoId().isBlank()) {
            orcamento.setServico(null);
        } else {
            var servico = servicoService.buscar(Long.valueOf(request.getServicoId()));
            if (!servico.getAtivo()) throw new RegraNegocioException("Selecione um servico ativo.");
            orcamento.setServico(servico);
        }
        orcamento.setDescricao(request.getDescricao().trim());
        orcamento.setValorEstimado(request.getValorEstimado());
        orcamento.setDataCriacao(request.getDataCriacao());
        orcamento.setValidade(request.getValidade());
    }

    private void expirarVencidos() {
        List<Orcamento> vencidos = orcamentoRepository.findByStatusInAndValidadeBefore(
                List.of(StatusOrcamento.PENDENTE), LocalDate.now());
        for (Orcamento orcamento : vencidos) orcamento.setStatus(StatusOrcamento.EXPIRADO);
        orcamentoRepository.saveAll(vencidos);
    }
}
