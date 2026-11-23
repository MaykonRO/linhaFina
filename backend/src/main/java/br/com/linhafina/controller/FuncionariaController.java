package br.com.linhafina.controller;

import br.com.linhafina.dto.FuncionariaRequest;
import br.com.linhafina.dto.FuncionariaResponse;
import br.com.linhafina.service.FuncionariaService;
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
@RequestMapping("/api/funcionarias")
public class FuncionariaController {

    private final FuncionariaService service;

    public FuncionariaController(FuncionariaService service) { this.service = service; }

    @GetMapping public List<FuncionariaResponse> listar() { return service.listar(); }

    @PostMapping
    public ResponseEntity<FuncionariaResponse> criar(@Valid @RequestBody FuncionariaRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(request));
    }

    @PutMapping("/{id}")
    public FuncionariaResponse atualizar(@PathVariable Long id, @Valid @RequestBody FuncionariaRequest request) {
        return service.atualizar(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> remover(@PathVariable Long id) {
        service.remover(id);
        return ResponseEntity.noContent().build();
    }
}
