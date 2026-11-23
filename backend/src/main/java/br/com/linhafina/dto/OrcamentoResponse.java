package br.com.linhafina.dto;

import br.com.linhafina.model.Orcamento;
import java.math.BigDecimal;
import java.time.LocalDate;

public class OrcamentoResponse {

    private String id;
    private String codigo;
    private String clienteId;
    private String servicoId;
    private String descricao;
    private BigDecimal valorEstimado;
    private LocalDate dataCriacao;
    private LocalDate validade;
    private String status;
    private String motivo;
    private String convertidoOsId;

    public OrcamentoResponse(Orcamento orcamento) {
        this.id = String.valueOf(orcamento.getId());
        this.codigo = orcamento.getCodigo();
        this.clienteId = String.valueOf(orcamento.getCliente().getId());
        this.servicoId = orcamento.getServico() == null ? "" : String.valueOf(orcamento.getServico().getId());
        this.descricao = orcamento.getDescricao();
        this.valorEstimado = orcamento.getValorEstimado();
        this.dataCriacao = orcamento.getDataCriacao();
        this.validade = orcamento.getValidade();
        this.status = orcamento.getStatus().paraApi();
        this.motivo = orcamento.getMotivo();
        this.convertidoOsId = orcamento.getConvertidoOs() == null ? "" : String.valueOf(orcamento.getConvertidoOs().getId());
    }

    public String getId() { return id; }
    public String getCodigo() { return codigo; }
    public String getClienteId() { return clienteId; }
    public String getServicoId() { return servicoId; }
    public String getDescricao() { return descricao; }
    public BigDecimal getValorEstimado() { return valorEstimado; }
    public LocalDate getDataCriacao() { return dataCriacao; }
    public LocalDate getValidade() { return validade; }
    public String getStatus() { return status; }
    public String getMotivo() { return motivo; }
    public String getConvertidoOsId() { return convertidoOsId; }
}
