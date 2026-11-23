package br.com.linhafina.model;

public enum StatusOrcamento {
    PENDENTE,
    APROVADO,
    RECUSADO,
    EXPIRADO,
    CONVERTIDO;

    public String paraApi() {
        return name().toLowerCase();
    }
}
