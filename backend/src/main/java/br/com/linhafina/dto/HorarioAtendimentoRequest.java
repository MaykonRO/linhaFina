package br.com.linhafina.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Um item enviado na secao de horarios. */
public class HorarioAtendimentoRequest {

    @NotBlank(message = "Informe o identificador do dia da semana.")
    private String id;

    @Size(max = 20, message = "O rótulo do dia deve ter no máximo 20 caracteres.")
    private String rotulo;

    private Boolean ativo;
    private String abre;
    private String fecha;

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getRotulo() { return rotulo; }
    public void setRotulo(String rotulo) { this.rotulo = rotulo; }
    public Boolean getAtivo() { return ativo; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
    public String getAbre() { return abre; }
    public void setAbre(String abre) { this.abre = abre; }
    public String getFecha() { return fecha; }
    public void setFecha(String fecha) { this.fecha = fecha; }
}
