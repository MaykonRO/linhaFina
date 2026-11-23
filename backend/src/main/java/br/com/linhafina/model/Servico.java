package br.com.linhafina.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "servicos")
public class Servico {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(nullable = false, length = 80)
    private String categoria;

    @Column(columnDefinition = "TEXT")
    private String descricao;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal precoReferencia;

    @Column(nullable = false)
    private Integer tempoEstimadoDias;

    @Column(nullable = false)
    private Integer tempoEstimadoHoras = 8;

    @Column(nullable = false)
    private Boolean ativo = true;

    public Servico() {
    }

    public Servico(String nome, String categoria, BigDecimal precoReferencia, Integer tempoEstimadoDias) {
        this.nome = nome;
        this.categoria = categoria;
        this.precoReferencia = precoReferencia;
        this.tempoEstimadoDias = tempoEstimadoDias;
        this.tempoEstimadoHoras = tempoEstimadoDias * 8;
        this.ativo = true;
    }

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public BigDecimal getPrecoReferencia() { return precoReferencia; }
    public void setPrecoReferencia(BigDecimal precoReferencia) { this.precoReferencia = precoReferencia; }
    public Integer getTempoEstimadoDias() { return tempoEstimadoDias; }
    public void setTempoEstimadoDias(Integer tempoEstimadoDias) { this.tempoEstimadoDias = tempoEstimadoDias; }
    public Integer getTempoEstimadoHoras() { return tempoEstimadoHoras; }
    public void setTempoEstimadoHoras(Integer tempoEstimadoHoras) { this.tempoEstimadoHoras = tempoEstimadoHoras; }
    public Boolean getAtivo() { return ativo; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
}
