package br.com.linhafina.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class PecaVitrineRequest {

    @NotBlank(message = "Informe o nome da peca") private String nome;
    @NotBlank(message = "Informe a categoria") private String categoria;
    private String descricao;
    @NotNull(message = "Informe o preco") @DecimalMin(value = "0.0", message = "O preco nao pode ser negativo") private BigDecimal preco;
    private String arte = "vestido-longo";
    private Boolean destaque = false;
    private Boolean ativo = true;
    private String imagemUrl;

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
}
