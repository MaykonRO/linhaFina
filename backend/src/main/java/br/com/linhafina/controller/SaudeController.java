package br.com.linhafina.controller;

import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Endpoint público usado apenas pelo health check da infraestrutura. */
@RestController
public class SaudeController {

    @GetMapping({"/api/saude", "/api/configuracoes"})
    public Map<String, String> verificar() {
        Map<String, String> resposta = new LinkedHashMap<>();
        resposta.put("status", "ok");
        return resposta;
    }
}
