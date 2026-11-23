package br.com.linhafina.dto;

import br.com.linhafina.model.Funcionaria;

public class FuncionariaResponse {

    private String id;
    private String nome;
    private String telefone;
    private String email;
    private String cargo;
    private String papel;
    private String status;
    private String especialidade;
    private String criadoEm;
    private String tipo;

    public FuncionariaResponse(Funcionaria funcionaria) {
        this.id = String.valueOf(funcionaria.getId());
        this.nome = funcionaria.getNome();
        this.telefone = funcionaria.getTelefone();
        this.email = funcionaria.getEmail();
        this.cargo = funcionaria.getCargo();
        this.papel = funcionaria.getPapel();
        this.status = funcionaria.getStatus();
        this.especialidade = funcionaria.getEspecialidade();
        this.criadoEm = funcionaria.getCriadoEm() == null ? null : funcionaria.getCriadoEm().toString();
        this.tipo = funcionaria.getTipoPessoa();
    }

    public String getId() { return id; }
    public String getNome() { return nome; }
    public String getTelefone() { return telefone; }
    public String getEmail() { return email; }
    public String getCargo() { return cargo; }
    public String getPapel() { return papel; }
    public String getStatus() { return status; }
    public String getEspecialidade() { return especialidade; }
    public String getCriadoEm() { return criadoEm; }
    public String getTipo() { return tipo; }
}
