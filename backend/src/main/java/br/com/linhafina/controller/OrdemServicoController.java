package br.com.linhafina.controller;

import br.com.linhafina.dto.CancelamentoRequest;
import br.com.linhafina.dto.OrdemServicoRequest;
import br.com.linhafina.dto.OrdemServicoResponse;
import br.com.linhafina.dto.PagamentoRequest;
import br.com.linhafina.dto.PrevisaoPrazoResponse;
import br.com.linhafina.dto.ProvaRequest;
import br.com.linhafina.service.OrdemServicoService;
import br.com.linhafina.service.PdfOrdemServicoService;
import org.springframework.http.MediaType;
import org.springframework.http.HttpHeaders;
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
@RequestMapping("/api/ordens-servico")
public class OrdemServicoController {

    private final OrdemServicoService service;
    private final PdfOrdemServicoService pdfService;

    public OrdemServicoController(OrdemServicoService service, PdfOrdemServicoService pdfService) {
        this.service = service;
        this.pdfService = pdfService;
    }

    @GetMapping public List<OrdemServicoResponse> listar() { return service.listar(); }
    @GetMapping("/{id}") public OrdemServicoResponse obter(@PathVariable Long id) { return service.obter(id); }

    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> pdf(@PathVariable Long id) {
        OrdemServicoResponse os = service.obter(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + os.getCodigo() + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdfService.gerar(id));
    }

    @PostMapping("/previsao")
    public PrevisaoPrazoResponse preverPrazo(@Valid @RequestBody OrdemServicoRequest request) {
        return service.preverPrazo(request);
    }

    @PostMapping
    public ResponseEntity<OrdemServicoResponse> criar(@Valid @RequestBody OrdemServicoRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.criar(request));
    }

    @PutMapping("/{id}")
    public OrdemServicoResponse atualizar(@PathVariable Long id, @Valid @RequestBody OrdemServicoRequest request) {
        return service.atualizar(id, request);
    }

    @PostMapping("/{id}/avancar-status")
    public OrdemServicoResponse avancar(@PathVariable Long id) { return service.avancarStatus(id); }

    @PostMapping("/{id}/prova")
    public OrdemServicoResponse prova(@PathVariable Long id, @Valid @RequestBody ProvaRequest request) {
        return service.registrarProva(id, request);
    }

    @PostMapping("/{id}/cancelar")
    public OrdemServicoResponse cancelar(@PathVariable Long id, @Valid @RequestBody CancelamentoRequest request) {
        return service.cancelar(id, request);
    }

    @PostMapping("/{id}/pagamento")
    public OrdemServicoResponse pagamento(@PathVariable Long id, @Valid @RequestBody PagamentoRequest request) {
        return service.registrarPagamento(id, request);
    }
}
