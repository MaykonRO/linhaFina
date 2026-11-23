package br.com.linhafina.service;

import br.com.linhafina.dto.ClienteRequest;
import br.com.linhafina.dto.ClienteResponse;
import br.com.linhafina.dto.FichaMedidasRequest;
import br.com.linhafina.exception.RecursoNaoEncontradoException;
import br.com.linhafina.exception.RegraNegocioException;
import br.com.linhafina.model.Cliente;
import br.com.linhafina.model.FichaMedidas;
import br.com.linhafina.repository.ClienteRepository;
import br.com.linhafina.repository.OrdemServicoRepository;
import br.com.linhafina.repository.OrcamentoRepository;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ClienteService {

    private final ClienteRepository clienteRepository;
    private final OrdemServicoRepository ordemRepository;
    private final OrcamentoRepository orcamentoRepository;

    public ClienteService(ClienteRepository clienteRepository, OrdemServicoRepository ordemRepository,
                          OrcamentoRepository orcamentoRepository) {
        this.clienteRepository = clienteRepository;
        this.ordemRepository = ordemRepository;
        this.orcamentoRepository = orcamentoRepository;
    }

    @Transactional(readOnly = true)
    public List<ClienteResponse> listar() {
        return clienteRepository.findAll().stream()
                .sorted(Comparator.comparing(c -> c.getNome().toLowerCase()))
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
        aplicarDados(cliente, request, true);
        if (request.getMedidas() != null) aplicarMedidas(cliente, request.getMedidas());
        return new ClienteResponse(clienteRepository.save(cliente));
    }

    @Transactional
    public ClienteResponse atualizar(Long id, ClienteRequest request) {
        Cliente cliente = buscar(id);
        aplicarDados(cliente, request, false);
        if (request.getMedidas() != null) aplicarMedidas(cliente, request.getMedidas());
        return new ClienteResponse(clienteRepository.save(cliente));
    }

    @Transactional
    public void remover(Long id) {
        Cliente cliente = buscar(id);
        if (ordemRepository.existsByClienteId(id) || orcamentoRepository.existsByClienteId(id)) {
            throw new RegraNegocioException("A cliente possui ordens ou orcamentos no historico e nao pode ser removida.");
        }
        clienteRepository.delete(cliente);
    }

    @Transactional(readOnly = true)
    public Cliente buscar(Long id) {
        return clienteRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Cliente nao encontrada."));
    }

    private void aplicarDados(Cliente cliente, ClienteRequest request, boolean criando) {
        if (criando || request.getNome() != null) cliente.setNome(obrigatorio(request.getNome(), "Informe o nome da cliente"));
        if (criando || request.getTelefone() != null) {
            String telefone = request.getTelefone() == null ? "" : request.getTelefone().replaceAll("\\D", "");
            if (telefone.length() < 10 || telefone.length() > 13) {
                throw new RegraNegocioException("O telefone deve ter de 10 a 13 digitos.");
            }
            cliente.setTelefone(telefone);
        }
        if (criando || request.getEmail() != null) cliente.setEmail(texto(request.getEmail()));
        if (criando || request.getCidade() != null) cliente.setCidade(texto(request.getCidade()));
        if (criando || request.getObservacoes() != null) cliente.setObservacoes(texto(request.getObservacoes()));
    }

    private void aplicarMedidas(Cliente cliente, FichaMedidasRequest request) {
        FichaMedidas medidas = cliente.getMedidas();
        if (medidas == null) medidas = new FichaMedidas();
        medidas.setBusto(request.getBusto());
        medidas.setCintura(request.getCintura());
        medidas.setQuadril(request.getQuadril());
        medidas.setOmbro(request.getOmbro());
        medidas.setManga(request.getManga());
        medidas.setComprimento(request.getComprimento());
        medidas.setObservacoes(texto(request.getObservacoes()));
        cliente.setMedidas(medidas);
    }

    private String obrigatorio(String valor, String mensagem) {
        String limpo = texto(valor);
        if (limpo.isEmpty()) throw new RegraNegocioException(mensagem);
        return limpo;
    }

    private String texto(String valor) {
        return valor == null ? "" : valor.trim();
    }
}
