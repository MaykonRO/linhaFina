package br.com.linhafina.dto;

import br.com.linhafina.model.OrdemServico;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

public class OrdemServicoResponse {

    private String id;
    private String codigo;
    private String clienteId;
    private String servicoId;
    private String responsavelId;
    private String tipoPeca;
    private String descricaoPeca;
    private String observacoes;
    private Boolean sobMedida;
    private Boolean ajuste;
    private Boolean urgente;
    private Boolean provaComparecida;
    private BigDecimal valorServico;
    private BigDecimal taxaUrgencia;
    private BigDecimal taxaGuarda;
    private BigDecimal desconto;
    private BigDecimal valorFinal;
    private BigDecimal valorPago;
    private LocalDate dataEntrada;
    private LocalDate dataPrevistaEntrega;
    private LocalDate dataProva;
    private LocalDate dataPronta;
    private LocalDate dataEntrega;
    private LocalDate dataPagamento;
    private String status;
    private String pagamentoStatus;
    private String motivoCancelamento;
    private String criadoEm;
    private List<PrazoImpactoResponse> impactosPrazo = List.of();

    public OrdemServicoResponse(OrdemServico os) {
        this.id = String.valueOf(os.getId());
        this.codigo = os.getCodigo();
        this.clienteId = String.valueOf(os.getCliente().getId());
        this.servicoId = String.valueOf(os.getServico().getId());
        this.responsavelId = os.getResponsavel() == null ? "" : String.valueOf(os.getResponsavel().getId());
        this.tipoPeca = os.getTipoPeca();
        this.descricaoPeca = os.getDescricaoPeca();
        this.observacoes = os.getObservacoes();
        this.sobMedida = os.getSobMedida();
        this.ajuste = os.getAjuste();
        this.urgente = os.getUrgente();
        this.provaComparecida = os.getProvaComparecida();
        this.valorServico = os.getValorServico();
        this.taxaUrgencia = os.getTaxaUrgencia();
        this.taxaGuarda = os.getTaxaGuarda();
        this.desconto = os.getDesconto();
        this.valorFinal = os.getValorFinal();
        this.valorPago = os.getValorPago();
        this.dataEntrada = os.getDataEntrada();
        this.dataPrevistaEntrega = os.getDataPrevistaEntrega();
        this.dataProva = os.getDataProva();
        this.dataPronta = os.getDataPronta();
        this.dataEntrega = os.getDataEntrega();
        this.dataPagamento = os.getDataPagamento();
        this.status = os.getStatus().paraApi();
        this.pagamentoStatus = os.getPagamentoStatus().paraApi();
        this.motivoCancelamento = os.getMotivoCancelamento();
        this.criadoEm = os.getCriadoEm() == null ? null : os.getCriadoEm().toString();
    }

    public String getId() { return id; }
    public String getCodigo() { return codigo; }
    public String getClienteId() { return clienteId; }
    public String getServicoId() { return servicoId; }
    public String getResponsavelId() { return responsavelId; }
    public String getTipoPeca() { return tipoPeca; }
    public String getDescricaoPeca() { return descricaoPeca; }
    public String getObservacoes() { return observacoes; }
    public Boolean getSobMedida() { return sobMedida; }
    public Boolean getAjuste() { return ajuste; }
    public Boolean getUrgente() { return urgente; }
    public Boolean getProvaComparecida() { return provaComparecida; }
    public BigDecimal getValorServico() { return valorServico; }
    public BigDecimal getTaxaUrgencia() { return taxaUrgencia; }
    public BigDecimal getTaxaGuarda() { return taxaGuarda; }
    public BigDecimal getDesconto() { return desconto; }
    public BigDecimal getValorFinal() { return valorFinal; }
    public BigDecimal getValorPago() { return valorPago; }
    public LocalDate getDataEntrada() { return dataEntrada; }
    public LocalDate getDataPrevistaEntrega() { return dataPrevistaEntrega; }
    public LocalDate getDataProva() { return dataProva; }
    public LocalDate getDataPronta() { return dataPronta; }
    public LocalDate getDataEntrega() { return dataEntrega; }
    public LocalDate getDataPagamento() { return dataPagamento; }
    public String getStatus() { return status; }
    public String getPagamentoStatus() { return pagamentoStatus; }
    public String getMotivoCancelamento() { return motivoCancelamento; }
    public String getCriadoEm() { return criadoEm; }
    public List<PrazoImpactoResponse> getImpactosPrazo() { return impactosPrazo; }
    public void setImpactosPrazo(List<PrazoImpactoResponse> impactosPrazo) { this.impactosPrazo = impactosPrazo; }
}
