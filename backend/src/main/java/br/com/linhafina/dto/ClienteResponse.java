package br.com.linhafina.dto;

import br.com.linhafina.model.Cliente;

public class ClienteResponse {

    private String id;
    private String nome;
    private String telefone;
    private String email;
    private String cidade;
    private String observacoes;
    private String criadoEm;
    private String tipo;
    private FichaMedidasResponse medidas;

    public ClienteResponse(Cliente cliente) {
        this.id = String.valueOf(cliente.getId());
        this.nome = cliente.getNome();
        this.telefone = cliente.getTelefone();
        this.email = cliente.getEmail();
        this.cidade = cliente.getCidade();
        this.observacoes = cliente.getObservacoes();
        this.criadoEm = cliente.getCriadoEm() == null ? null : cliente.getCriadoEm().toString();
        this.tipo = cliente.getTipoPessoa();
        this.medidas = cliente.getMedidas() == null ? null : new FichaMedidasResponse(cliente.getMedidas());
    }

    public String getId() { return id; }
    public String getNome() { return nome; }
    public String getTelefone() { return telefone; }
    public String getEmail() { return email; }
    public String getCidade() { return cidade; }
    public String getObservacoes() { return observacoes; }
    public String getCriadoEm() { return criadoEm; }
    public String getTipo() { return tipo; }
    public FichaMedidasResponse getMedidas() { return medidas; }
}
