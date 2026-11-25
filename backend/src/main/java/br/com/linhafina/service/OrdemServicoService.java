package br.com.linhafina.service;

import br.com.linhafina.dto.OrdemServicoRequest;
import br.com.linhafina.dto.OrdemServicoResponse;
import br.com.linhafina.exception.RecursoNaoEncontradoException;
import br.com.linhafina.exception.RegraNegocioException;
import br.com.linhafina.model.Cliente;
import br.com.linhafina.model.OrdemServico;
import br.com.linhafina.model.StatusOrdem;
import br.com.linhafina.repository.OrdemServicoRepository;
import java.util.ArrayList;
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
        List<OrdemServico> ordens = ordemRepository.findAll();
        List<OrdemServicoResponse> resposta = new ArrayList<>();
        for (OrdemServico ordem : ordens) {
            resposta.add(new OrdemServicoResponse(ordem));
        }
        return resposta;
    }

    @Transactional(readOnly = true)
    public OrdemServicoResponse obter(Long id) {
        OrdemServico ordem = buscar(id);
        return new OrdemServicoResponse(ordem);
    }

    @Transactional
    public OrdemServicoResponse criar(OrdemServicoRequest request) {
        OrdemServico ordem = new OrdemServico();
        aplicarDados(ordem, request);
        OrdemServico ordemSalva = ordemRepository.save(ordem);
        return new OrdemServicoResponse(ordemSalva);
    }

    @Transactional
    public OrdemServicoResponse atualizar(Long id, OrdemServicoRequest request) {
        OrdemServico ordem = buscar(id);
        aplicarDados(ordem, request);
        OrdemServico ordemSalva = ordemRepository.save(ordem);
        return new OrdemServicoResponse(ordemSalva);
    }

    @Transactional
    public void remover(Long id) {
        OrdemServico ordem = buscar(id);
        ordemRepository.delete(ordem);
    }

    @Transactional(readOnly = true)
    public OrdemServico buscar(Long id) {
        OrdemServico ordem = ordemRepository.findById(id).orElse(null);
        if (ordem == null) {
            throw new RecursoNaoEncontradoException("Ordem de servico nao encontrada.");
        }
        return ordem;
    }

    private void aplicarDados(OrdemServico ordem, OrdemServicoRequest request) {
        Long clienteId = Long.valueOf(request.getClienteId());
        Cliente cliente = clienteService.buscar(clienteId);
        ordem.setCliente(cliente);
        ordem.setDescricaoServico(request.getDescricaoServico().trim());
        ordem.setValor(request.getValor());
        ordem.setDataEntrada(request.getDataEntrada());
        ordem.setDataPrevistaEntrega(request.getDataPrevistaEntrega());

        if (request.getDataPrevistaEntrega().isBefore(request.getDataEntrada())) {
            throw new RegraNegocioException("A previsao de entrega nao pode ser anterior a data de entrada.");
        }

        if (request.getStatus() != null && !request.getStatus().isBlank()) {
            StatusOrdem status = StatusOrdem.deTexto(request.getStatus());
            ordem.setStatus(status);
        }
    }
}
