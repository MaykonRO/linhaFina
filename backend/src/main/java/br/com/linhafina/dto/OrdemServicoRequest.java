package br.com.linhafina.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;

public class OrdemServicoRequest {

    @NotBlank(message = "Selecione uma cliente")
    private String clienteId;

    @NotBlank(message = "Descreva o servico")
    private String descricaoServico;

    @NotNull(message = "Informe o valor do servico")
    @DecimalMin(value = "0.0", inclusive = false, message = "O valor do servico deve ser maior que zero")
    private BigDecimal valor;

    @NotNull(message = "Informe a data de entrada")
    private LocalDate dataEntrada;

    @NotNull(message = "Informe a data prevista de entrega")
    private LocalDate dataPrevistaEntrega;

    private String status;

    public String getClienteId() {
        return clienteId;
    }

    public void setClienteId(String clienteId) {
        this.clienteId = clienteId;
    }

    public String getDescricaoServico() {
        return descricaoServico;
    }

    public void setDescricaoServico(String descricaoServico) {
        this.descricaoServico = descricaoServico;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public void setValor(BigDecimal valor) {
        this.valor = valor;
    }

    public LocalDate getDataEntrada() {
        return dataEntrada;
    }

    public void setDataEntrada(LocalDate dataEntrada) {
        this.dataEntrada = dataEntrada;
    }

    public LocalDate getDataPrevistaEntrega() {
        return dataPrevistaEntrega;
    }

    public void setDataPrevistaEntrega(LocalDate dataPrevistaEntrega) {
        this.dataPrevistaEntrega = dataPrevistaEntrega;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
