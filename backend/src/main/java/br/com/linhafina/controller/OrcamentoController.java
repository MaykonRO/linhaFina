package br.com.linhafina.controller;

import br.com.linhafina.dto.OrcamentoRequest;
import br.com.linhafina.dto.OrcamentoResponse;
import br.com.linhafina.dto.OrdemServicoResponse;
import br.com.linhafina.dto.RecusaOrcamentoRequest;
import br.com.linhafina.service.OrcamentoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orcamentos")
public class OrcamentoController {

    private final OrcamentoService service;

    public OrcamentoController(OrcamentoService service) { this.service = service; }

    @GetMapping public List<OrcamentoResponse> listar() { return service.listar(); }
    @GetMapping("/{id}") public OrcamentoResponse obter(@PathVariable Long id) { return service.obter(id); }

    @PostMapping
    public ResponseEntity<OrcamentoResponse> criar(@Valid @RequestBody OrcamentoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(request));
    }

    @PutMapping("/{id}")
    public OrcamentoResponse atualizar(@PathVariable Long id, @Valid @RequestBody OrcamentoRequest request) {
        return service.atualizar(id, request);
    }

    @PostMapping("/{id}/aprovar") public OrcamentoResponse aprovar(@PathVariable Long id) { return service.aprovar(id); }

    @PostMapping("/{id}/recusar")
    public OrcamentoResponse recusar(@PathVariable Long id, @RequestBody RecusaOrcamentoRequest request) {
        return service.recusar(id, request);
    }

    @PostMapping("/{id}/converter") public OrdemServicoResponse converter(@PathVariable Long id) { return service.converter(id); }
}
