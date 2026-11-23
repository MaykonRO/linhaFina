package br.com.linhafina.dto;

import br.com.linhafina.model.PecaVitrine;
import java.math.BigDecimal;

public class PecaVitrineResponse {

    private String id;
    private String nome;
    private String categoria;
    private String descricao;
    private BigDecimal preco;
    private String arte;
    private Boolean destaque;
    private Boolean ativo;
    private String imagemUrl;

    public PecaVitrineResponse(PecaVitrine peca) {
        this.id = String.valueOf(peca.getId());
        this.nome = peca.getNome();
        this.categoria = peca.getCategoria();
        this.descricao = peca.getDescricao();
        this.preco = peca.getPreco();
        this.arte = peca.getArte();
        this.destaque = peca.getDestaque();
        this.ativo = peca.getAtivo();
        this.imagemUrl = peca.getImagemUrl();
    }

    public String getId() { return id; }
    public String getNome() { return nome; }
    public String getCategoria() { return categoria; }
    public String getDescricao() { return descricao; }
    public BigDecimal getPreco() { return preco; }
    public String getArte() { return arte; }
    public Boolean getDestaque() { return destaque; }
    public Boolean getAtivo() { return ativo; }
    public String getImagemUrl() { return imagemUrl; }
}
