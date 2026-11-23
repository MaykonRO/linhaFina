package br.com.linhafina.dto;

import br.com.linhafina.model.Servico;
import java.math.BigDecimal;

public class ServicoResponse {

    private String id;
    private String nome;
    private String categoria;
    private String descricao;
    private BigDecimal precoReferencia;
    private Integer tempoEstimadoDias;
    private Integer tempoEstimadoHoras;
    private Boolean ativo;

    public ServicoResponse(Servico servico) {
        this.id = String.valueOf(servico.getId());
        this.nome = servico.getNome();
        this.categoria = servico.getCategoria();
        this.descricao = servico.getDescricao();
        this.precoReferencia = servico.getPrecoReferencia();
        this.tempoEstimadoDias = servico.getTempoEstimadoDias();
        this.tempoEstimadoHoras = servico.getTempoEstimadoHoras();
        this.ativo = servico.getAtivo();
    }

    public String getId() { return id; }
    public String getNome() { return nome; }
    public String getCategoria() { return categoria; }
    public String getDescricao() { return descricao; }
    public BigDecimal getPrecoReferencia() { return precoReferencia; }
    public Integer getTempoEstimadoDias() { return tempoEstimadoDias; }
    public Integer getTempoEstimadoHoras() { return tempoEstimadoHoras; }
    public Boolean getAtivo() { return ativo; }
}
