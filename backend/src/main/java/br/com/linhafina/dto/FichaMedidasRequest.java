package br.com.linhafina.dto;

import jakarta.validation.constraints.DecimalMin;
import java.math.BigDecimal;

public class FichaMedidasRequest {

    @DecimalMin(value = "0.0", message = "A medida nao pode ser negativa") private BigDecimal busto;
    @DecimalMin(value = "0.0", message = "A medida nao pode ser negativa") private BigDecimal cintura;
    @DecimalMin(value = "0.0", message = "A medida nao pode ser negativa") private BigDecimal quadril;
    @DecimalMin(value = "0.0", message = "A medida nao pode ser negativa") private BigDecimal ombro;
    @DecimalMin(value = "0.0", message = "A medida nao pode ser negativa") private BigDecimal manga;
    @DecimalMin(value = "0.0", message = "A medida nao pode ser negativa") private BigDecimal comprimento;
    private String observacoes;

    public BigDecimal getBusto() { return busto; }
    public void setBusto(BigDecimal busto) { this.busto = busto; }
    public BigDecimal getCintura() { return cintura; }
    public void setCintura(BigDecimal cintura) { this.cintura = cintura; }
    public BigDecimal getQuadril() { return quadril; }
    public void setQuadril(BigDecimal quadril) { this.quadril = quadril; }
    public BigDecimal getOmbro() { return ombro; }
    public void setOmbro(BigDecimal ombro) { this.ombro = ombro; }
    public BigDecimal getManga() { return manga; }
    public void setManga(BigDecimal manga) { this.manga = manga; }
    public BigDecimal getComprimento() { return comprimento; }
    public void setComprimento(BigDecimal comprimento) { this.comprimento = comprimento; }
    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
}
