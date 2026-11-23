package br.com.linhafina.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "fichas_medidas")
public class FichaMedidas {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(optional = false)
    @JoinColumn(name = "cliente_id", nullable = false, unique = true)
    private Cliente cliente;

    @Column(precision = 6, scale = 2) private BigDecimal busto;
    @Column(precision = 6, scale = 2) private BigDecimal cintura;
    @Column(precision = 6, scale = 2) private BigDecimal quadril;
    @Column(precision = 6, scale = 2) private BigDecimal ombro;
    @Column(precision = 6, scale = 2) private BigDecimal manga;
    @Column(precision = 6, scale = 2) private BigDecimal comprimento;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    public FichaMedidas() {
    }

    public Long getId() { return id; }
    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
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
