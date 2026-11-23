package br.com.linhafina.dto;

public class NotificacoesConfiguracaoRequest {

    private Boolean atrasos;
    private Boolean provas;
    private Boolean orcamentosVencendo;
    private Boolean resumoDiario;

    public Boolean getAtrasos() { return atrasos; }
    public void setAtrasos(Boolean atrasos) { this.atrasos = atrasos; }
    public Boolean getProvas() { return provas; }
    public void setProvas(Boolean provas) { this.provas = provas; }
    public Boolean getOrcamentosVencendo() { return orcamentosVencendo; }
    public void setOrcamentosVencendo(Boolean valor) { this.orcamentosVencendo = valor; }
    public Boolean getResumoDiario() { return resumoDiario; }
    public void setResumoDiario(Boolean resumoDiario) { this.resumoDiario = resumoDiario; }
}
