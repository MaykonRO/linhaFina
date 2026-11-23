package br.com.linhafina.dto;

import br.com.linhafina.model.FichaMedidas;
import java.math.BigDecimal;

public class FichaMedidasResponse {

    private BigDecimal busto;
    private BigDecimal cintura;
    private BigDecimal quadril;
    private BigDecimal ombro;
    private BigDecimal manga;
    private BigDecimal comprimento;
    private String observacoes;

    public FichaMedidasResponse(FichaMedidas medidas) {
        this.busto = medidas.getBusto();
        this.cintura = medidas.getCintura();
        this.quadril = medidas.getQuadril();
        this.ombro = medidas.getOmbro();
        this.manga = medidas.getManga();
        this.comprimento = medidas.getComprimento();
        this.observacoes = medidas.getObservacoes();
    }

    public BigDecimal getBusto() { return busto; }
    public BigDecimal getCintura() { return cintura; }
    public BigDecimal getQuadril() { return quadril; }
    public BigDecimal getOmbro() { return ombro; }
    public BigDecimal getManga() { return manga; }
    public BigDecimal getComprimento() { return comprimento; }
    public String getObservacoes() { return observacoes; }
}
