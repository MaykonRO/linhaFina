package br.com.linhafina.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class ServicoRequest {

    @NotBlank(message = "Informe o nome do servico")
    @Size(max = 120, message = "O nome deve ter no maximo 120 caracteres")
    private String nome;

    @NotBlank(message = "Selecione a categoria")
    private String categoria;
    private String descricao;

    @NotNull(message = "Informe um preco de referencia")
    @DecimalMin(value = "0.01", message = "O preco deve ser maior que zero")
    private BigDecimal precoReferencia;

    @NotNull(message = "Informe o tempo estimado")
    @Min(value = 1, message = "O tempo estimado deve ser de pelo menos 1 dia")
    private Integer tempoEstimadoDias;
    private Boolean ativo = true;

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
    public Boolean getAtivo() { return ativo; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
}
