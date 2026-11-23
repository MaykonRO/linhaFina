package br.com.linhafina.service;

import br.com.linhafina.dto.PecaVitrineResponse;
import br.com.linhafina.exception.RecursoNaoEncontradoException;
import br.com.linhafina.exception.RegraNegocioException;
import br.com.linhafina.model.PecaVitrine;
import br.com.linhafina.repository.PecaVitrineRepository;
import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class ImagemVitrineService {

    private static final long TAMANHO_MAXIMO = 5L * 1024 * 1024;
    private static final Map<String, String> TIPOS = Map.of(
            "image/png", "png", "image/jpeg", "jpg", "image/webp", "webp");

    private final PecaVitrineRepository repository;
    private final Path diretorio;

    public ImagemVitrineService(PecaVitrineRepository repository,
                                @Value("${atelie.upload-diretorio:uploads}") String diretorio) {
        this.repository = repository;
        this.diretorio = Paths.get(diretorio).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.diretorio);
        } catch (IOException erro) {
            throw new IllegalStateException("Nao foi possivel preparar o diretorio de uploads.", erro);
        }
    }

    @Transactional
    public PecaVitrineResponse salvar(Long id, MultipartFile arquivo) {
        if (arquivo == null || arquivo.isEmpty()) throw new RegraNegocioException("Selecione uma imagem.");
        if (arquivo.getSize() > TAMANHO_MAXIMO) throw new RegraNegocioException("A imagem deve ter no maximo 5 MB.");
        String extensao = TIPOS.get(arquivo.getContentType());
        if (extensao == null) throw new RegraNegocioException("Use uma imagem PNG, JPEG ou WebP.");

        PecaVitrine peca = repository.findById(id)
                .orElseThrow(() -> new RecursoNaoEncontradoException("Peca da vitrine nao encontrada."));
        String nomeArquivo = UUID.randomUUID() + "." + extensao;
        Path destino = diretorio.resolve(nomeArquivo).normalize();
        if (!destino.startsWith(diretorio)) throw new RegraNegocioException("Caminho de imagem invalido.");
        try {
            Files.copy(arquivo.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);
        } catch (IOException erro) {
            throw new IllegalStateException("Nao foi possivel salvar a imagem.", erro);
        }
        removerArquivo(peca.getImagemUrl());
        peca.setImagemUrl("/api/vitrine/imagens/" + nomeArquivo);
        return new PecaVitrineResponse(repository.save(peca));
    }

    public Resource abrir(String nomeArquivo) {
        if (!nomeArquivo.matches("[a-f0-9-]{36}\\.(png|jpg|webp)")) {
            throw new RecursoNaoEncontradoException("Imagem nao encontrada.");
        }
        Path caminho = diretorio.resolve(nomeArquivo).normalize();
        if (!caminho.startsWith(diretorio) || !Files.isRegularFile(caminho)) {
            throw new RecursoNaoEncontradoException("Imagem nao encontrada.");
        }
        try {
            return new UrlResource(caminho.toUri());
        } catch (MalformedURLException erro) {
            throw new RecursoNaoEncontradoException("Imagem nao encontrada.");
        }
    }

    public void removerArquivo(String imagemUrl) {
        if (imagemUrl == null || !imagemUrl.startsWith("/api/vitrine/imagens/")) return;
        String nome = imagemUrl.substring("/api/vitrine/imagens/".length());
        if (!nome.matches("[a-f0-9-]{36}\\.(png|jpg|webp)")) return;
        Path caminho = diretorio.resolve(nome).normalize();
        if (!caminho.startsWith(diretorio)) return;
        try {
            Files.deleteIfExists(caminho);
        } catch (IOException erro) {
            throw new IllegalStateException("Nao foi possivel remover a imagem anterior.", erro);
        }
    }
}
