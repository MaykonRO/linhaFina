package br.com.linhafina.controller;

import br.com.linhafina.dto.ServicoRequest;
import br.com.linhafina.dto.ServicoResponse;
import br.com.linhafina.dto.SituacaoRequest;
import br.com.linhafina.service.ServicoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/servicos")
public class ServicoController {

    private final ServicoService service;

    public ServicoController(ServicoService service) { this.service = service; }

    @GetMapping public List<ServicoResponse> listar() { return service.listar(); }
    @GetMapping("/{id}") public ServicoResponse obter(@PathVariable Long id) { return service.obter(id); }

    @PostMapping
    public ResponseEntity<ServicoResponse> criar(@Valid @RequestBody ServicoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(request));
    }

    @PutMapping("/{id}")
    public ServicoResponse atualizar(@PathVariable Long id, @Valid @RequestBody ServicoRequest request) {
        return service.atualizar(id, request);
    }

    @PatchMapping("/{id}/situacao")
    public ServicoResponse alternar(@PathVariable Long id, @Valid @RequestBody SituacaoRequest request) {
        return service.alternarSituacao(id, request.getAtivo());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        service.remover(id);
        return ResponseEntity.noContent().build();
    }
}
