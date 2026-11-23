package br.com.linhafina.dto;

import jakarta.validation.constraints.NotNull;

public class SituacaoRequest {

    @NotNull(message = "Informe se o servico esta ativo")
    private Boolean ativo;

    public Boolean getAtivo() { return ativo; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
}
