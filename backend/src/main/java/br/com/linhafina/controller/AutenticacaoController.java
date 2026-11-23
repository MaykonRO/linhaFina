package br.com.linhafina.controller;

import br.com.linhafina.dto.LoginRequest;
import br.com.linhafina.dto.UsuarioResponse;
import br.com.linhafina.service.AutenticacaoService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/autenticacao")
public class AutenticacaoController {

    private final AutenticacaoService service;

    public AutenticacaoController(AutenticacaoService service) {
        this.service = service;
    }

    @PostMapping("/entrar")
    public UsuarioResponse entrar(@Valid @RequestBody LoginRequest request,
                                  HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        return service.entrar(request, httpRequest, httpResponse);
    }

    @GetMapping("/sessao")
    public UsuarioResponse sessao() {
        return service.sessaoAtual();
    }

    @PostMapping("/sair")
    public ResponseEntity<Void> sair(HttpServletRequest request) {
        service.sair(request);
        return ResponseEntity.noContent().build();
    }
}
