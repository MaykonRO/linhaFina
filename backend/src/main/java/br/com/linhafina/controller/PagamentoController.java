package br.com.linhafina.controller;

import br.com.linhafina.dto.OrdemServicoResponse;
import br.com.linhafina.dto.PagamentoRequest;
import br.com.linhafina.dto.PagamentoResponse;
import br.com.linhafina.service.OrdemServicoService;
import br.com.linhafina.service.PagamentoService;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/pagamentos")
public class PagamentoController {
    private final PagamentoService pagamentoService;
    private final OrdemServicoService ordemService;

    public PagamentoController(PagamentoService pagamentoService, OrdemServicoService ordemService) {
        this.pagamentoService = pagamentoService;
        this.ordemService = ordemService;
    }

    @GetMapping
    public List<PagamentoResponse> listar() {
        return pagamentoService.listar();
    }

    @PostMapping("/{id}")
    public OrdemServicoResponse registrar(@PathVariable Long id, @Valid @RequestBody PagamentoRequest request) {
        return ordemService.registrarPagamento(id, request);
    }
}
