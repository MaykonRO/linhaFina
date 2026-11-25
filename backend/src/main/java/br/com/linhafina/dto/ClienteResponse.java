package br.com.linhafina.dto;

import br.com.linhafina.model.Cliente;

public class ClienteResponse {

    private String id;
    private String nome;
    private String telefone;
    private String email;
    private String criadoEm;

    public ClienteResponse(Cliente cliente) {
        this.id = String.valueOf(cliente.getId());
        this.nome = cliente.getNome();
        this.telefone = cliente.getTelefone();
        this.email = cliente.getEmail();
        this.criadoEm = cliente.getCriadoEm() == null ? null : cliente.getCriadoEm().toString();
    }

    public String getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getTelefone() {
        return telefone;
    }

    public String getEmail() {
        return email;
    }

    public String getCriadoEm() {
        return criadoEm;
    }
}
