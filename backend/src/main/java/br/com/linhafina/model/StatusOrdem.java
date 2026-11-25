package br.com.linhafina.model;

import br.com.linhafina.exception.RegraNegocioException;

public enum StatusOrdem {
    PENDENTE,
    EM_ANDAMENTO,
    CONCLUIDA,
    CANCELADA;

    public String paraApi() {
        return name().toLowerCase();
    }

    public static StatusOrdem deTexto(String texto) {
        try {
            return valueOf(texto.trim().toUpperCase());
        } catch (Exception erro) {
            throw new RegraNegocioException("Status de ordem de servico invalido: " + texto);
        }
    }
}
