package br.com.linhafina.service;

import br.com.linhafina.dto.ClienteRequest;
import br.com.linhafina.dto.ClienteResponse;
import br.com.linhafina.exception.RecursoNaoEncontradoException;
import br.com.linhafina.exception.RegraNegocioException;
import br.com.linhafina.model.Cliente;
import br.com.linhafina.repository.ClienteRepository;
import br.com.linhafina.repository.OrdemServicoRepository;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final OrdemServicoRepository ordemRepository;

    public ClienteService(ClienteRepository clienteRepository, OrdemServicoRepository ordemRepository) {
        this.clienteRepository = clienteRepository;
        this.ordemRepository = ordemRepository;
    }

    @Transactional(readOnly = true)
    public List<ClienteResponse> listar() {
        return clienteRepository.findAll().stream()
                .sorted(Comparator.comparing(cliente -> cliente.getNome().toLowerCase()))
                .map(ClienteResponse::new)
                .toList();
    }

    @Transactional(readOnly = true)
    public ClienteResponse obter(Long id) {
        return new ClienteResponse(buscar(id));
    }

    @Transactional
    public ClienteResponse criar(ClienteRequest request) {
        Cliente cliente = new Cliente();
        aplicarDados(cliente, request);
        return new ClienteResponse(clienteRepository.save(cliente));
    }

    @Transactional
    public ClienteResponse atualizar(Long id, ClienteRequest request) {
        Cliente cliente = buscar(id);
        aplicarDados(cliente, request);
        return new ClienteResponse(clienteRepository.save(cliente));
    }

    @Transactional
    public void remover(Long id) {
        Cliente cliente = buscar(id);
        if (ordemRepository.existsByClienteId(id)) {
            throw new RegraNegocioException("A cliente possui ordens de servico e nao pode ser removida.");
        }
        clienteRepository.delete(cliente);
    }

    @Transactional(readOnly = true)
    public Cliente buscar(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente nao encontrada."));
    }

    private void aplicarDados(Cliente cliente, ClienteRequest request) {
        cliente.setNome(request.getNome().trim());

        String telefone = request.getTelefone().replaceAll("\\D", "");
        if (telefone.length() < 10 || telefone.length() > 13) {
            throw new RegraNegocioException("O telefone deve ter de 10 a 13 digitos.");
        }
        cliente.setTelefone(telefone);
        cliente.setEmail(request.getEmail() == null ? "" : request.getEmail().trim());
    }
}
