package br.com.linhafina.service;

import br.com.linhafina.dto.ServicoRequest;
import br.com.linhafina.dto.ServicoResponse;
import br.com.linhafina.exception.RecursoNaoEncontradoException;
import br.com.linhafina.exception.RegraNegocioException;
import br.com.linhafina.model.Servico;
import br.com.linhafina.repository.OrdemServicoRepository;
import br.com.linhafina.repository.OrcamentoRepository;
import br.com.linhafina.repository.ServicoRepository;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ServicoService {

    private final ServicoRepository servicoRepository;
    private final OrdemServicoRepository ordemRepository;
    private final OrcamentoRepository orcamentoRepository;

    public ServicoService(ServicoRepository servicoRepository, OrdemServicoRepository ordemRepository,
                          OrcamentoRepository orcamentoRepository) {
        this.servicoRepository = servicoRepository;
        this.ordemRepository = ordemRepository;
        this.orcamentoRepository = orcamentoRepository;
    }

    @Transactional(readOnly = true)
    public List<ServicoResponse> listar() {
        return servicoRepository.findAll().stream()
                .sorted(Comparator.comparing(s -> s.getNome().toLowerCase()))
                .map(ServicoResponse::new).toList();
    }

    @Transactional(readOnly = true)
    public ServicoResponse obter(Long id) {
        return new ServicoResponse(buscar(id));
    }

    @Transactional
    public ServicoResponse criar(ServicoRequest request) {
        Servico servico = new Servico();
        aplicarDados(servico, request);
        return new ServicoResponse(servicoRepository.save(servico));
    }

    @Transactional
    public ServicoResponse atualizar(Long id, ServicoRequest request) {
        Servico servico = buscar(id);
        aplicarDados(servico, request);
        return new ServicoResponse(servicoRepository.save(servico));
    }

    @Transactional
    public ServicoResponse alternarSituacao(Long id, boolean ativo) {
        Servico servico = buscar(id);
        servico.setAtivo(ativo);
        return new ServicoResponse(servicoRepository.save(servico));
    }

    @Transactional
    public void remover(Long id) {
        Servico servico = buscar(id);
        if (ordemRepository.existsByServicoId(id) || orcamentoRepository.existsByServicoId(id)) {
            throw new RegraNegocioException("O servico possui historico e nao pode ser removido. Desative-o.");
        }
        servicoRepository.delete(servico);
    }

    @Transactional(readOnly = true)
    public Servico buscar(Long id) {
        return servicoRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Servico nao encontrado."));
    }

    private void aplicarDados(Servico servico, ServicoRequest request) {
        servico.setNome(request.getNome().trim());
        servico.setCategoria(request.getCategoria().trim());
        servico.setDescricao(request.getDescricao() == null ? "" : request.getDescricao().trim());
        servico.setPrecoReferencia(request.getPrecoReferencia());
        servico.setTempoEstimadoDias(request.getTempoEstimadoDias());
        // O formulario trabalha em dias; 8 horas e a referencia cadastrada para cada dia.
        servico.setTempoEstimadoHoras(request.getTempoEstimadoDias() * 8);
        servico.setAtivo(request.getAtivo() == null || request.getAtivo());
    }
}
