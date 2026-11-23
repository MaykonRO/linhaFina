package br.com.linhafina.controller;

import br.com.linhafina.service.ConfiguracaoService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/configuracoes")
public class ConfiguracaoController {

    private final ConfiguracaoService service;

    public ConfiguracaoController(ConfiguracaoService service) {
        this.service = service;
    }

    @GetMapping
    public Map<String, Object> buscar() {
        return service.buscar();
    }

    @PutMapping
    public Map<String, Object> atualizar(@RequestBody Map<String, Object> alteracoes) {
        return service.atualizar(alteracoes);
    }
}
