package br.com.linhafina.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "ordens_servico")
public class OrdemServico {

    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "ordem_servico_generator")
    @SequenceGenerator(name = "ordem_servico_generator", sequenceName = "ordem_servico_seq", allocationSize = 1)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String codigo;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "cliente_id", nullable = false)
    private Cliente cliente;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "servico_id", nullable = false)
    private Servico servico;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "responsavel_id")
    private Funcionaria responsavel;

    @Column(nullable = false, length = 100) private String tipoPeca;
    @Column(nullable = false, columnDefinition = "TEXT") private String descricaoPeca;
    @Column(columnDefinition = "TEXT") private String observacoes;
    @Column(nullable = false) private Boolean sobMedida = false;
    @Column(nullable = false) private Boolean ajuste = false;
    @Column(nullable = false) private Boolean urgente = false;
    @Column(nullable = false) private Boolean provaComparecida = false;

    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal valorServico = BigDecimal.ZERO;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal taxaUrgencia = BigDecimal.ZERO;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal taxaGuarda = BigDecimal.ZERO;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal desconto = BigDecimal.ZERO;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal valorFinal = BigDecimal.ZERO;
    @Column(nullable = false, precision = 12, scale = 2) private BigDecimal valorPago = BigDecimal.ZERO;

    @Column(nullable = false) private LocalDate dataEntrada;
    private LocalDate dataPrevistaEntrega;
    private LocalDate dataProva;
    private LocalDate dataPronta;
    private LocalDate dataEntrega;
    private LocalDate dataPagamento;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusOrdem status = StatusOrdem.AGUARDANDO;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private StatusPagamento pagamentoStatus = StatusPagamento.PENDENTE;

    @Column(columnDefinition = "TEXT") private String motivoCancelamento;
    @Column(nullable = false, updatable = false) private LocalDateTime criadoEm;

    public OrdemServico() {
    }

    @PrePersist
    protected void registrarCriacao() {
        if (criadoEm == null) criadoEm = LocalDateTime.now();
        if (codigo == null) codigo = String.format("OS-%06d", id);
    }

    public void recalcularValorFinal() {
        BigDecimal acrescimo = taxaUrgencia == null ? BigDecimal.ZERO : taxaUrgencia;
        BigDecimal guarda = taxaGuarda == null ? BigDecimal.ZERO : taxaGuarda;
        BigDecimal abatimento = desconto == null ? BigDecimal.ZERO : desconto;
        valorFinal = valorServico.add(acrescimo).add(guarda).subtract(abatimento).max(BigDecimal.ZERO);
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo; }
    public Cliente getCliente() { return cliente; }
    public void setCliente(Cliente cliente) { this.cliente = cliente; }
    public Servico getServico() { return servico; }
    public void setServico(Servico servico) { this.servico = servico; }
    public Funcionaria getResponsavel() { return responsavel; }
    public void setResponsavel(Funcionaria responsavel) { this.responsavel = responsavel; }
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
    public Boolean getProvaComparecida() { return provaComparecida; }
    public void setProvaComparecida(Boolean provaComparecida) { this.provaComparecida = provaComparecida; }
    public BigDecimal getValorServico() { return valorServico; }
    public void setValorServico(BigDecimal valorServico) { this.valorServico = valorServico; }
    public BigDecimal getTaxaUrgencia() { return taxaUrgencia; }
    public void setTaxaUrgencia(BigDecimal taxaUrgencia) { this.taxaUrgencia = taxaUrgencia; }
    public BigDecimal getTaxaGuarda() { return taxaGuarda; }
    public void setTaxaGuarda(BigDecimal taxaGuarda) { this.taxaGuarda = taxaGuarda; }
    public BigDecimal getDesconto() { return desconto; }
    public void setDesconto(BigDecimal desconto) { this.desconto = desconto; }
    public BigDecimal getValorFinal() { return valorFinal; }
    public BigDecimal getValorPago() { return valorPago; }
    public void setValorPago(BigDecimal valorPago) { this.valorPago = valorPago; }
    public LocalDate getDataEntrada() { return dataEntrada; }
    public void setDataEntrada(LocalDate dataEntrada) { this.dataEntrada = dataEntrada; }
    public LocalDate getDataPrevistaEntrega() { return dataPrevistaEntrega; }
    public void setDataPrevistaEntrega(LocalDate dataPrevistaEntrega) { this.dataPrevistaEntrega = dataPrevistaEntrega; }
    public LocalDate getDataProva() { return dataProva; }
    public void setDataProva(LocalDate dataProva) { this.dataProva = dataProva; }
    public LocalDate getDataPronta() { return dataPronta; }
    public void setDataPronta(LocalDate dataPronta) { this.dataPronta = dataPronta; }
    public LocalDate getDataEntrega() { return dataEntrega; }
    public void setDataEntrega(LocalDate dataEntrega) { this.dataEntrega = dataEntrega; }
    public LocalDate getDataPagamento() { return dataPagamento; }
    public void setDataPagamento(LocalDate dataPagamento) { this.dataPagamento = dataPagamento; }
    public StatusOrdem getStatus() { return status; }
    public void setStatus(StatusOrdem status) { this.status = status; }
    public StatusPagamento getPagamentoStatus() { return pagamentoStatus; }
    public void setPagamentoStatus(StatusPagamento pagamentoStatus) { this.pagamentoStatus = pagamentoStatus; }
    public String getMotivoCancelamento() { return motivoCancelamento; }
    public void setMotivoCancelamento(String motivoCancelamento) { this.motivoCancelamento = motivoCancelamento; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
}
