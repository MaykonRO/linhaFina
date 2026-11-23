package br.com.linhafina.dto;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;

public class FidelidadeConfiguracaoRequest {

    private Boolean ativo;

    @DecimalMin(value = "0", message = "O desconto de fidelidade não pode ser negativo.")
    @DecimalMax(value = "100", message = "O desconto de fidelidade não pode passar de 100.")
    private BigDecimal descontoPercentual;

    @Min(value = 1, message = "A quantidade de serviços necessários deve ser pelo menos 1.")
    private Integer servicosNecessarios;

    @Size(max = 2000, message = "A regra de fidelidade deve ter no máximo 2000 caracteres.")
    private String regra;

    public Boolean getAtivo() { return ativo; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
    public BigDecimal getDescontoPercentual() { return descontoPercentual; }
    public void setDescontoPercentual(BigDecimal valor) { this.descontoPercentual = valor; }
    public Integer getServicosNecessarios() { return servicosNecessarios; }
    public void setServicosNecessarios(Integer quantidade) { this.servicosNecessarios = quantidade; }
    public String getRegra() { return regra; }
    public void setRegra(String regra) { this.regra = regra; }
}
