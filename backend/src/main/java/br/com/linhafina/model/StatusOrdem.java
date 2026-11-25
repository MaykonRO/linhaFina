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
        if (texto == null || texto.isBlank()) {
            throw new RegraNegocioException("Informe um status de ordem de servico.");
        }

        for (StatusOrdem status : values()) {
            if (status.name().equalsIgnoreCase(texto.trim())) {
                return status;
            }
        }
        throw new RegraNegocioException("Status de ordem de servico invalido: " + texto);
    }
}
