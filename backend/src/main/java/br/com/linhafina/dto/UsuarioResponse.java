package br.com.linhafina.dto;

import br.com.linhafina.model.Usuario;

public class UsuarioResponse {

    private String id;
    private String nome;
    private String email;
    private String papel;
    private String papelRotulo;

    public UsuarioResponse(Usuario usuario) {
        this.id = String.valueOf(usuario.getId());
        this.nome = usuario.getNome();
        this.email = usuario.getEmail();
        this.papel = usuario.getPapel().paraApi();
        this.papelRotulo = usuario.getPapel().getRotulo();
    }

    public String getId() { return id; }
    public String getNome() { return nome; }
    public String getEmail() { return email; }
    public String getPapel() { return papel; }
    public String getPapelRotulo() { return papelRotulo; }
}
