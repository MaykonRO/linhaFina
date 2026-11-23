package br.com.linhafina.dto;

import br.com.linhafina.model.Pagamento;
import java.math.BigDecimal;
import java.time.LocalDate;

public class PagamentoResponse {
    private String id;
    private String ordemServicoId;
    private String codigoOrdem;
    private BigDecimal valor;
    private LocalDate dataPagamento;
    private String criadoEm;

    public PagamentoResponse(Pagamento pagamento) {
        this.id = String.valueOf(pagamento.getId());
        this.ordemServicoId = String.valueOf(pagamento.getOrdemServico().getId());
        this.codigoOrdem = pagamento.getOrdemServico().getCodigo();
        this.valor = pagamento.getValor();
        this.dataPagamento = pagamento.getDataPagamento();
        this.criadoEm = pagamento.getCriadoEm() == null ? null : pagamento.getCriadoEm().toString();
    }

    public String getId() { return id; }
    public String getOrdemServicoId() { return ordemServicoId; }
    public String getCodigoOrdem() { return codigoOrdem; }
    public BigDecimal getValor() { return valor; }
    public LocalDate getDataPagamento() { return dataPagamento; }
    public String getCriadoEm() { return criadoEm; }
}
