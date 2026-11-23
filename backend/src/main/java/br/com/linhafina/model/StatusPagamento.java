package br.com.linhafina.model;

import br.com.linhafina.exception.RegraNegocioException;

public enum StatusPagamento {
    PENDENTE,
    PARCIAL,
    PAGO;

    public String paraApi() {
        return name().toLowerCase();
    }

    public static StatusPagamento deTexto(String texto) {
        try {
            return valueOf(texto.trim().toUpperCase());
        } catch (Exception erro) {
            throw new RegraNegocioException("Situacao de pagamento invalida: " + texto);
        }
    }
}
