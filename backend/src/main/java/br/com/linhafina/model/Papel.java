package br.com.linhafina.model;

public enum Papel {
    DONO("Dono"),
    ADMIN("Administrador"),
    LIDER("Líder"),
    FUNCIONARIO("Funcionário"),
    ATENDIMENTO("Atendimento");

    private final String rotulo;

    Papel(String rotulo) {
        this.rotulo = rotulo;
    }

    public String getRotulo() { return rotulo; }
    public String paraApi() { return name().toLowerCase(); }
}
