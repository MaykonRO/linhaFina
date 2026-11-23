package br.com.linhafina.model;

import br.com.linhafina.exception.RegraNegocioException;

public enum StatusOrdem {
    AGUARDANDO,
    PRODUCAO,
    PROVA,
    PRONTA,
    ENTREGUE,
    CANCELADA;

    public String paraApi() {
        return name().toLowerCase();
    }

    public boolean estaAberta() {
        return this == AGUARDANDO || this == PRODUCAO || this == PROVA || this == PRONTA;
    }

    public StatusOrdem proximo() {
        return switch (this) {
            case AGUARDANDO -> PRODUCAO;
            case PRODUCAO -> PROVA;
            case PROVA -> PRONTA;
            case PRONTA -> ENTREGUE;
            default -> throw new RegraNegocioException("Esta ordem nao pode avancar de etapa.");
        };
    }

    public static StatusOrdem deTexto(String texto) {
        try {
            return valueOf(texto.trim().toUpperCase());
        } catch (Exception erro) {
            throw new RegraNegocioException("Status de ordem de servico invalido: " + texto);
        }
    }
}
