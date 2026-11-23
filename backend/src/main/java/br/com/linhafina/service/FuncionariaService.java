package br.com.linhafina.service;

import br.com.linhafina.dto.FuncionariaRequest;
import br.com.linhafina.dto.FuncionariaResponse;
import br.com.linhafina.exception.RecursoNaoEncontradoException;
import br.com.linhafina.exception.RegraNegocioException;
import br.com.linhafina.model.Funcionaria;
import br.com.linhafina.repository.FuncionariaRepository;
import br.com.linhafina.repository.OrdemServicoRepository;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class FuncionariaService {

    private static final Set<String> STATUS = Set.of("disponivel", "em_servico", "afastada");
    private final FuncionariaRepository funcionariaRepository;
    private final OrdemServicoRepository ordemRepository;

    public FuncionariaService(FuncionariaRepository funcionariaRepository, OrdemServicoRepository ordemRepository) {
        this.funcionariaRepository = funcionariaRepository;
        this.ordemRepository = ordemRepository;
    }

    @Transactional(readOnly = true)
    public List<FuncionariaResponse> listar() {
        return funcionariaRepository.findAll().stream()
                .sorted(Comparator.comparing(f -> f.getNome().toLowerCase()))
                .map(FuncionariaResponse::new).toList();
    }

    @Transactional(readOnly = true)
    public Funcionaria buscar(Long id) {
        return funcionariaRepository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Funcionaria nao encontrada."));
    }

    @Transactional
    public FuncionariaResponse criar(FuncionariaRequest request) {
        Funcionaria funcionaria = new Funcionaria();
        aplicarDados(funcionaria, request);
        return new FuncionariaResponse(funcionariaRepository.save(funcionaria));
    }

    @Transactional
    public FuncionariaResponse atualizar(Long id, FuncionariaRequest request) {
        Funcionaria funcionaria = buscar(id);
        aplicarDados(funcionaria, request);
        return new FuncionariaResponse(funcionariaRepository.save(funcionaria));
    }

    @Transactional
    public void remover(Long id) {
        Funcionaria funcionaria = buscar(id);
        if (ordemRepository.existsByResponsavelId(id)) {
            throw new RegraNegocioException("A funcionaria possui OS atribuidas e nao pode ser removida.");
        }
        funcionariaRepository.delete(funcionaria);
    }

    private void aplicarDados(Funcionaria funcionaria, FuncionariaRequest request) {
        if (!STATUS.contains(request.getStatus())) throw new RegraNegocioException("Status de funcionaria invalido.");
        funcionaria.setNome(request.getNome().trim());
        funcionaria.setTelefone(request.getTelefone() == null ? "" : request.getTelefone().replaceAll("\\D", ""));
        funcionaria.setEmail(request.getEmail() == null ? "" : request.getEmail().trim());
        funcionaria.setCargo(texto(request.getCargo()));
        funcionaria.setPapel(texto(request.getPapel()));
        funcionaria.setStatus(request.getStatus());
        funcionaria.setEspecialidade(texto(request.getEspecialidade()));
    }

    private String texto(String valor) {
        return valor == null ? "" : valor.trim();
    }
}
