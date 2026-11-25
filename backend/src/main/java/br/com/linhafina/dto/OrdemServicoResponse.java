package br.com.linhafina.dto;

import br.com.linhafina.model.OrdemServico;
import java.math.BigDecimal;

public class OrdemServicoResponse {

    private String id;
    private String codigo;
    private String clienteId;
    private String descricaoServico;
    private BigDecimal valor;
    private String dataEntrada;
    private String dataPrevistaEntrega;
    private String status;
    private String criadoEm;

    public OrdemServicoResponse(OrdemServico ordem) {
        this.id = String.valueOf(ordem.getId());
        this.codigo = ordem.getCodigo();
        this.clienteId = String.valueOf(ordem.getCliente().getId());
        this.descricaoServico = ordem.getDescricaoServico();
        this.valor = ordem.getValor();
        this.dataEntrada = ordem.getDataEntrada() == null ? null : ordem.getDataEntrada().toString();
        this.dataPrevistaEntrega = ordem.getDataPrevistaEntrega() == null ? null : ordem.getDataPrevistaEntrega().toString();
        this.status = ordem.getStatus().paraApi();
        this.criadoEm = ordem.getCriadoEm() == null ? null : ordem.getCriadoEm().toString();
    }

    public String getId() {
        return id;
    }

    public String getCodigo() {
        return codigo;
    }

    public String getClienteId() {
        return clienteId;
    }

    public String getDescricaoServico() {
        return descricaoServico;
    }

    public BigDecimal getValor() {
        return valor;
    }

    public String getDataEntrada() {
        return dataEntrada;
    }

    public String getDataPrevistaEntrega() {
        return dataPrevistaEntrega;
    }

    public String getStatus() {
        return status;
    }

    public String getCriadoEm() {
        return criadoEm;
    }
}
