package br.com.linhafina.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class OrcamentoRequest {

    @NotBlank(message = "Selecione uma cliente") private String clienteId;
    private String servicoId;
    @NotBlank(message = "Descreva o servico orcado") private String descricao;
    @NotNull(message = "Informe o valor estimado") @DecimalMin(value = "0.01", message = "O valor deve ser maior que zero") private BigDecimal valorEstimado;
    @NotNull(message = "Informe a data de criacao") private LocalDate dataCriacao;
    @NotNull(message = "Informe a validade") private LocalDate validade;

    public String getClienteId() { return clienteId; }
    public void setClienteId(String clienteId) { this.clienteId = clienteId; }
    public String getServicoId() { return servicoId; }
    public void setServicoId(String servicoId) { this.servicoId = servicoId; }
    public String getDescricao() { return descricao; }
    public void setDescricao(String descricao) { this.descricao = descricao; }
    public BigDecimal getValorEstimado() { return valorEstimado; }
    public void setValorEstimado(BigDecimal valorEstimado) { this.valorEstimado = valorEstimado; }
    public LocalDate getDataCriacao() { return dataCriacao; }
    public void setDataCriacao(LocalDate dataCriacao) { this.dataCriacao = dataCriacao; }
    public LocalDate getValidade() { return validade; }
    public void setValidade(LocalDate validade) { this.validade = validade; }
}
