package br.com.linhafina.dto;

import java.time.LocalDate;
import java.util.List;

public class PrevisaoPrazoResponse {

    private LocalDate dataPrevistaEntrega;
    private int horasFila;
    private int horasServico;
    private int diasUteis;
    private List<PrazoImpactoResponse> impactosPrazo;

    public PrevisaoPrazoResponse(LocalDate dataPrevistaEntrega, int horasFila, int horasServico, int diasUteis,
                                 List<PrazoImpactoResponse> impactosPrazo) {
        this.dataPrevistaEntrega = dataPrevistaEntrega;
        this.horasFila = horasFila;
        this.horasServico = horasServico;
        this.diasUteis = diasUteis;
        this.impactosPrazo = impactosPrazo;
    }

    public LocalDate getDataPrevistaEntrega() { return dataPrevistaEntrega; }
    public int getHorasFila() { return horasFila; }
    public int getHorasServico() { return horasServico; }
    public int getDiasUteis() { return diasUteis; }
    public List<PrazoImpactoResponse> getImpactosPrazo() { return impactosPrazo; }
}
