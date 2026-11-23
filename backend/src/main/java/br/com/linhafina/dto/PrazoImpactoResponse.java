package br.com.linhafina.dto;

import java.time.LocalDate;

public class PrazoImpactoResponse {

    private String osId;
    private String codigo;
    private LocalDate prazoAnterior;
    private LocalDate novoPrazo;

    public PrazoImpactoResponse(String osId, String codigo, LocalDate prazoAnterior, LocalDate novoPrazo) {
        this.osId = osId;
        this.codigo = codigo;
        this.prazoAnterior = prazoAnterior;
        this.novoPrazo = novoPrazo;
    }

    public String getOsId() { return osId; }
    public String getCodigo() { return codigo; }
    public LocalDate getPrazoAnterior() { return prazoAnterior; }
    public LocalDate getNovoPrazo() { return novoPrazo; }
}
