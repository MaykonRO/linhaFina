package br.com.linhafina.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "clientes")
public class Cliente extends Pessoa {

    @Column(nullable = false, length = 20)
    private String telefone;

    @Column(nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    public Cliente() {
        super();
    }

    public Cliente(String nome, String telefone, String email) {
        super(nome, email);
        this.telefone = telefone;
    }

    @PrePersist
    protected void registrarCriacao() {
        if (criadoEm == null) {
            criadoEm = LocalDateTime.now();
        }
    }

    @Override
    public String getTipoPessoa() {
        return "cliente";
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public LocalDateTime getCriadoEm() {
        return criadoEm;
    }
}
