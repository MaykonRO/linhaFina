package br.com.linhafina.service;

import br.com.linhafina.dto.PecaVitrineRequest;
import br.com.linhafina.dto.PecaVitrineResponse;
import br.com.linhafina.exception.RecursoNaoEncontradoException;
import br.com.linhafina.exception.RegraNegocioException;
import br.com.linhafina.model.PecaVitrine;
import br.com.linhafina.repository.PecaVitrineRepository;
import java.math.BigDecimal;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class VitrineService {

    private static final Set<String> CATEGORIAS = Set.of("Vestidos", "Alfaiataria", "Camisas", "Saias", "Festa", "Conjuntos", "Casacos", "Noiva");
    private static final Set<String> ARTES = Set.of("vestido-longo", "blazer", "camisa", "saia", "vestido-festa", "conjunto", "noiva", "kimono", "camiseta");
    private final PecaVitrineRepository repository;
    private final ImagemVitrineService imagemService;

    public VitrineService(PecaVitrineRepository repository, ImagemVitrineService imagemService) {
        this.repository = repository;
        this.imagemService = imagemService;
    }

    @Transactional(readOnly = true)
    public List<PecaVitrineResponse> listarAdministracao() {
        return repository.findAll().stream()
                .sorted(Comparator.comparing(PecaVitrine::getCriadoEm).reversed())
                .map(PecaVitrineResponse::new).toList();
    }

    @Transactional(readOnly = true)
    public List<PecaVitrineResponse> listarPublica() {
        return repository.findByAtivoTrueOrderByDestaqueDescNomeAsc().stream().map(PecaVitrineResponse::new).toList();
    }

    @Transactional
    public PecaVitrineResponse criar(PecaVitrineRequest request) {
        PecaVitrine peca = new PecaVitrine();
        aplicarDados(peca, request);
        return new PecaVitrineResponse(repository.save(peca));
    }

    @Transactional
    public PecaVitrineResponse atualizar(Long id, PecaVitrineRequest request) {
        PecaVitrine peca = buscar(id);
        aplicarDados(peca, request);
        return new PecaVitrineResponse(repository.save(peca));
    }

    @Transactional
    public PecaVitrineResponse alternarExibicao(Long id) {
        PecaVitrine peca = buscar(id);
        peca.setAtivo(!peca.getAtivo());
        return new PecaVitrineResponse(repository.save(peca));
    }

    @Transactional
    public PecaVitrineResponse alternarDestaque(Long id) {
        PecaVitrine peca = buscar(id);
        peca.setDestaque(!peca.getDestaque());
        return new PecaVitrineResponse(repository.save(peca));
    }

    @Transactional
    public void remover(Long id) {
        PecaVitrine peca = buscar(id);
        imagemService.removerArquivo(peca.getImagemUrl());
        repository.delete(peca);
    }

    private PecaVitrine buscar(Long id) {
        return repository.findById(id).orElseThrow(() -> new RecursoNaoEncontradoException("Peca da vitrine nao encontrada."));
    }

    private void aplicarDados(PecaVitrine peca, PecaVitrineRequest request) {
        if (!CATEGORIAS.contains(request.getCategoria())) throw new RegraNegocioException("Categoria da vitrine invalida.");
        String arte = request.getArte() == null ? "vestido-longo" : request.getArte();
        if (!ARTES.contains(arte)) throw new RegraNegocioException("Arte da vitrine invalida.");
        peca.setNome(request.getNome().trim());
        peca.setCategoria(request.getCategoria());
        peca.setDescricao(request.getDescricao() == null ? "" : request.getDescricao().trim());
        peca.setPreco(request.getPreco() == null ? BigDecimal.ZERO : request.getPreco());
        peca.setArte(arte);
        peca.setDestaque(Boolean.TRUE.equals(request.getDestaque()));
        peca.setAtivo(request.getAtivo() == null || request.getAtivo());
        if (request.getImagemUrl() != null) peca.setImagemUrl(request.getImagemUrl().trim());
    }
}
