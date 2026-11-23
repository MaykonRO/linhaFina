package br.com.linhafina.controller;

import br.com.linhafina.dto.PecaVitrineRequest;
import br.com.linhafina.dto.PecaVitrineResponse;
import br.com.linhafina.service.VitrineService;
import br.com.linhafina.service.ImagemVitrineService;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestParam;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/vitrine")
public class VitrineController {

    private final VitrineService service;
    private final ImagemVitrineService imagemService;

    public VitrineController(VitrineService service, ImagemVitrineService imagemService) {
        this.service = service;
        this.imagemService = imagemService;
    }

    @GetMapping("/publica") public List<PecaVitrineResponse> publica() { return service.listarPublica(); }

    @GetMapping("/imagens/{nome}")
    public ResponseEntity<Resource> imagem(@PathVariable String nome) {
        Resource recurso = imagemService.abrir(nome);
        MediaType tipo = nome.endsWith(".png") ? MediaType.IMAGE_PNG : nome.endsWith(".jpg") ? MediaType.IMAGE_JPEG : MediaType.parseMediaType("image/webp");
        return ResponseEntity.ok().contentType(tipo).body(recurso);
    }

    @PostMapping("/pecas/{id}/imagem")
    public PecaVitrineResponse enviarImagem(@PathVariable Long id, @RequestParam("arquivo") MultipartFile arquivo) {
        return imagemService.salvar(id, arquivo);
    }

    @GetMapping("/pecas") public List<PecaVitrineResponse> listar() { return service.listarAdministracao(); }

    @PostMapping("/pecas")
    public ResponseEntity<PecaVitrineResponse> criar(@Valid @RequestBody PecaVitrineRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(request));
    }

    @PutMapping("/pecas/{id}")
    public PecaVitrineResponse atualizar(@PathVariable Long id, @Valid @RequestBody PecaVitrineRequest request) {
        return service.atualizar(id, request);
    }

    @PostMapping("/pecas/{id}/alternar-exibicao") public PecaVitrineResponse exibicao(@PathVariable Long id) { return service.alternarExibicao(id); }
    @PostMapping("/pecas/{id}/alternar-destaque") public PecaVitrineResponse destaque(@PathVariable Long id) { return service.alternarDestaque(id); }

    @DeleteMapping("/pecas/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        service.remover(id);
        return ResponseEntity.noContent().build();
    }
}
