package br.com.linhafina.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public class OrdemServicoRequest {

    @NotBlank(message = "Selecione uma cliente") private String clienteId;
    @NotBlank(message = "Selecione o tipo de servico") private String servicoId;
    private String responsavelId;

    @NotBlank(message = "Informe o tipo de peca") @Size(max = 100) private String tipoPeca;
    @NotBlank(message = "Descreva a peca") private String descricaoPeca;
    private String observacoes;
    private Boolean sobMedida = false;
    private Boolean ajuste = false;
    private Boolean urgente = false;

    @NotNull(message = "Informe o valor do servico")
    @DecimalMin(value = "0.01", message = "O valor do servico deve ser maior que zero")
    private BigDecimal valorServico;

    @NotNull(message = "Informe o desconto")
    @DecimalMin(value = "0.0", message = "O desconto nao pode ser negativo")
    private BigDecimal desconto = BigDecimal.ZERO;

    @NotNull(message = "Informe a data de entrada") private LocalDate dataEntrada;
    private LocalDate dataPrevistaEntrega;
    private LocalDate dataProva;
    private String status = "aguardando";

    public String getClienteId() { return clienteId; }
    public void setClienteId(String clienteId) { this.clienteId = clienteId; }
    public String getServicoId() { return servicoId; }
    public void setServicoId(String servicoId) { this.servicoId = servicoId; }
    public String getResponsavelId() { return responsavelId; }
    public void setResponsavelId(String responsavelId) { this.responsavelId = responsavelId; }
    public String getTipoPeca() { return tipoPeca; }
    public void setTipoPeca(String tipoPeca) { this.tipoPeca = tipoPeca; }
    public String getDescricaoPeca() { return descricaoPeca; }
    public void setDescricaoPeca(String descricaoPeca) { this.descricaoPeca = descricaoPeca; }
    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
    public Boolean getSobMedida() { return sobMedida; }
    public void setSobMedida(Boolean sobMedida) { this.sobMedida = sobMedida; }
    public Boolean getAjuste() { return ajuste; }
    public void setAjuste(Boolean ajuste) { this.ajuste = ajuste; }
    public Boolean getUrgente() { return urgente; }
    public void setUrgente(Boolean urgente) { this.urgente = urgente; }
    public BigDecimal getValorServico() { return valorServico; }
    public void setValorServico(BigDecimal valorServico) { this.valorServico = valorServico; }
    public BigDecimal getDesconto() { return desconto; }
    public void setDesconto(BigDecimal desconto) { this.desconto = desconto; }
    public LocalDate getDataEntrada() { return dataEntrada; }
    public void setDataEntrada(LocalDate dataEntrada) { this.dataEntrada = dataEntrada; }
    public LocalDate getDataPrevistaEntrega() { return dataPrevistaEntrega; }
    public void setDataPrevistaEntrega(LocalDate dataPrevistaEntrega) { this.dataPrevistaEntrega = dataPrevistaEntrega; }
    public LocalDate getDataProva() { return dataProva; }
    public void setDataProva(LocalDate dataProva) { this.dataProva = dataProva; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
