package br.com.linhafina.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "pagamentos")
public class Pagamento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "ordem_servico_id", nullable = false)
    private OrdemServico ordemServico;

    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal valor;

    @Column(nullable = false)
    private LocalDate dataPagamento;

    @Column(nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    public Pagamento() {
    }

    public Pagamento(OrdemServico ordemServico, BigDecimal valor, LocalDate dataPagamento) {
        this.ordemServico = ordemServico;
        this.valor = valor;
        this.dataPagamento = dataPagamento;
    }

    @PrePersist
    protected void registrarCriacao() {
        if (criadoEm == null) criadoEm = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public OrdemServico getOrdemServico() { return ordemServico; }
    public BigDecimal getValor() { return valor; }
    public LocalDate getDataPagamento() { return dataPagamento; }
    public LocalDateTime getCriadoEm() { return criadoEm; }
}
