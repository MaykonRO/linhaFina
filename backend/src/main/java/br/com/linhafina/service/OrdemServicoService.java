package br.com.linhafina.service;

import br.com.linhafina.dto.OrdemServicoRequest;
import br.com.linhafina.dto.OrdemServicoResponse;
import br.com.linhafina.exception.RecursoNaoEncontradoException;
import br.com.linhafina.exception.RegraNegocioException;
import br.com.linhafina.model.OrdemServico;
import br.com.linhafina.model.StatusOrdem;
import br.com.linhafina.repository.OrdemServicoRepository;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class OrdemServicoService {

    private final OrdemServicoRepository ordemRepository;
    private final ClienteService clienteService;

    public OrdemServicoService(OrdemServicoRepository ordemRepository, ClienteService clienteService) {
        this.ordemRepository = ordemRepository;
        this.clienteService = clienteService;
    }

    @Transactional(readOnly = true)
    public List<OrdemServicoResponse> listar() {
        return ordemRepository.findAll().stream()
                .sorted(Comparator.comparing(OrdemServico::getCriadoEm).reversed())
                .map(OrdemServicoResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public OrdemServicoResponse obter(Long id) {
        return new OrdemServicoResponse(buscar(id));
    }

    @Transactional
    public OrdemServicoResponse criar(OrdemServicoRequest request) {
        OrdemServico os = new OrdemServico();
        aplicarDados(os, request);
        return new OrdemServicoResponse(ordemRepository.save(os));
    }

    @Transactional
    public OrdemServicoResponse atualizar(Long id, OrdemServicoRequest request) {
        OrdemServico os = buscar(id);
        aplicarDados(os, request);
        return new OrdemServicoResponse(ordemRepository.save(os));
    }

    @Transactional
    public void remover(Long id) {
        ordemRepository.delete(buscar(id));
    }

    @Transactional(readOnly = true)
    public OrdemServico buscar(Long id) {
        return ordemRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Ordem de servico nao encontrada."));
    }

    private void aplicarDados(OrdemServico os, OrdemServicoRequest request) {
        os.setCliente(clienteService.buscar(Long.valueOf(request.getClienteId())));
        os.setDescricaoServico(request.getDescricaoServico().trim());
        os.setValor(request.getValor());
        os.setDataEntrada(request.getDataEntrada());
        os.setDataPrevistaEntrega(request.getDataPrevistaEntrega());

        if (request.getDataPrevistaEntrega().isBefore(request.getDataEntrada())) {
            throw new RegraNegocioException("A previsao de entrega nao pode ser anterior a data de entrada.");
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            os.setStatus(StatusOrdem.deTexto(request.getStatus()));
        }
    }
}
