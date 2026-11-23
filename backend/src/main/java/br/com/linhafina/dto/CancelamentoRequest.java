package br.com.linhafina.dto;

import jakarta.validation.constraints.NotBlank;

public class CancelamentoRequest {

    @NotBlank(message = "Informe o motivo do cancelamento")
    private String motivo;

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }
}
