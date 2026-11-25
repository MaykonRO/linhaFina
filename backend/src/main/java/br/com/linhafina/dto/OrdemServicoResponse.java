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

    public OrdemServicoResponse(OrdemServico os) {
        this.id = String.valueOf(os.getId());
        this.codigo = os.getCodigo();
        this.clienteId = String.valueOf(os.getCliente().getId());
        this.descricaoServico = os.getDescricaoServico();
        this.valor = os.getValor();
        this.dataEntrada = os.getDataEntrada() == null ? null : os.getDataEntrada().toString();
        this.dataPrevistaEntrega = os.getDataPrevistaEntrega() == null ? null : os.getDataPrevistaEntrega().toString();
        this.status = os.getStatus().paraApi();
        this.criadoEm = os.getCriadoEm() == null ? null : os.getCriadoEm().toString();
    }

    public String getId() { return id; }
    public String getCodigo() { return codigo; }
    public String getClienteId() { return clienteId; }
    public String getDescricaoServico() { return descricaoServico; }
    public BigDecimal getValor() { return valor; }
    public String getDataEntrada() { return dataEntrada; }
    public String getDataPrevistaEntrega() { return dataPrevistaEntrega; }
    public String getStatus() { return status; }
    public String getCriadoEm() { return criadoEm; }
}
