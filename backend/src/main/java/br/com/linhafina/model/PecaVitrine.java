package br.com.linhafina.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "pecas_vitrine")
public class PecaVitrine {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120) private String nome;
    @Column(nullable = false, length = 80) private String categoria;
    @Column(columnDefinition = "TEXT") private String descricao;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal preco = BigDecimal.ZERO;
    @Column(nullable = false, length = 60) private String arte = "vestido-longo";
    @Column(nullable = false) private Boolean destaque = false;
    @Column(nullable = false) private Boolean ativo = true;
    @Column(length = 500) private String imagemUrl;
    @Column(nullable = false, updatable = false) private LocalDateTime criadoEm;

    @PrePersist
    protected void registrarCriacao() {
        if (criadoEm == null) criadoEm = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public BigDecimal getPreco() { return preco; }
    public void setPreco(BigDecimal preco) { this.preco = preco; }
    public String getArte() { return arte; }
    public void setArte(String arte) { this.arte = arte; }
    public Boolean getDestaque() { return destaque; }
    public void setDestaque(Boolean destaque) { this.destaque = destaque; }
    public Boolean getAtivo() { return ativo; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
    public String getImagemUrl() { return imagemUrl; }
    public void setImagemUrl(String imagemUrl) { this.imagemUrl = imagemUrl; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
}
