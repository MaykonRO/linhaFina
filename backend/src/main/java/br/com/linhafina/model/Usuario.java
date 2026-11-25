package br.com.linhafina.model;

import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Table;

@Entity
@Table(name = "usuarios")
@AttributeOverride(name = "email", column = @Column(nullable = false, unique = true, length = 160))
public class Usuario extends Pessoa {

    @Column(nullable = false, length = 100)
    private String senhaHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private Papel papel;

    @Column(nullable = false)
    private Boolean ativo = true;

    public Usuario() {
        super();
    }

    public Usuario(String nome, String email, String senhaHash, Papel papel) {
        super(nome, email);
        this.senhaHash = senhaHash;
        this.papel = papel;
        this.ativo = true;
    }

    @Override
    public String getTipoPessoa() {
        return "usuario";
    }

    public String getSenhaHash() {
        return senhaHash;
    }

    public Papel getPapel() {
        return papel;
    }

    public Boolean getAtivo() {
        return ativo;
    }

    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }
}
