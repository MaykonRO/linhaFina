package br.com.linhafina.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;

public class PagamentoRequest {

    @NotBlank(message = "Informe a situacao do pagamento")
    private String status;

    @NotNull(message = "Informe o valor desta baixa")
    @DecimalMin(value = "0.01", message = "O valor pago deve ser maior que zero")
    private BigDecimal valorPago;

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public BigDecimal getValorPago() { return valorPago; }
    public void setValorPago(BigDecimal valorPago) { this.valorPago = valorPago; }
}
