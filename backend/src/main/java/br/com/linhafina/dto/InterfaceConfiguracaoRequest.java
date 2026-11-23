package br.com.linhafina.dto;

public class InterfaceConfiguracaoRequest {

    private Boolean compactarTabelas;
    private Boolean mostrarValores;

    public Boolean getCompactarTabelas() { return compactarTabelas; }
    public void setCompactarTabelas(Boolean compactarTabelas) { this.compactarTabelas = compactarTabelas; }
    public Boolean getMostrarValores() { return mostrarValores; }
    public void setMostrarValores(Boolean mostrarValores) { this.mostrarValores = mostrarValores; }
}
