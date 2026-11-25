package br.com.linhafina.service;

import br.com.linhafina.dto.ClienteRequest;
import br.com.linhafina.dto.ClienteResponse;
import br.com.linhafina.exception.RecursoNaoEncontradoException;
import br.com.linhafina.exception.RegraNegocioException;
import br.com.linhafina.model.Cliente;
import br.com.linhafina.repository.ClienteRepository;
import br.com.linhafina.repository.OrdemServicoRepository;
import java.util.ArrayList;
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
        List<Cliente> clientes = clienteRepository.findAll();
        List<ClienteResponse> resposta = new ArrayList<>();
        for (Cliente cliente : clientes) {
            resposta.add(new ClienteResponse(cliente));
        }
        return resposta;
    }

    @Transactional(readOnly = true)
    public ClienteResponse obter(Long id) {
        Cliente cliente = buscar(id);
        return new ClienteResponse(cliente);
    }

    @Transactional
    public ClienteResponse criar(ClienteRequest request) {
        Cliente cliente = new Cliente();
        aplicarDados(cliente, request);
        Cliente clienteSalva = clienteRepository.save(cliente);
        return new ClienteResponse(clienteSalva);
    }

    @Transactional
    public ClienteResponse atualizar(Long id, ClienteRequest request) {
        Cliente cliente = buscar(id);
        aplicarDados(cliente, request);
        Cliente clienteSalva = clienteRepository.save(cliente);
        return new ClienteResponse(clienteSalva);
    }

    @Transactional
    public void remover(Long id) {
        Cliente cliente = buscar(id);
        boolean possuiOrdem = ordemRepository.existsByClienteId(id);
        if (possuiOrdem) {
            throw new RegraNegocioException("A cliente possui ordens de servico e nao pode ser removida.");
        }
        clienteRepository.delete(cliente);
    }

    @Transactional(readOnly = true)
    public Cliente buscar(Long id) {
        Cliente cliente = clienteRepository.findById(id).orElse(null);
        if (cliente == null) {
            throw new RecursoNaoEncontradoException("Cliente nao encontrada.");
        }
        return cliente;
    }

    private void aplicarDados(Cliente cliente, ClienteRequest request) {
        cliente.setNome(request.getNome().trim());

        String telefone = request.getTelefone().replaceAll("\\D", "");
        if (telefone.length() < 10 || telefone.length() > 13) {
            throw new RegraNegocioException("O telefone deve ter de 10 a 13 digitos.");
        }
        cliente.setTelefone(telefone);

        String email = request.getEmail();
        if (email == null) {
            cliente.setEmail("");
        } else {
            cliente.setEmail(email.trim());
        }
    }
}
