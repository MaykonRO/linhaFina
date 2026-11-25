package br.com.linhafina.model;

import jakarta.persistence.Column;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.MappedSuperclass;

/**
 * Classe base com os dados comuns de Cliente e Usuario.
 * MappedSuperclass herda os campos sem criar uma tabela "pessoas".
 */
@MappedSuperclass
public abstract class Pessoa {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String nome;

    @Column(length = 160)
    private String email;

    protected Pessoa() {
    }

    protected Pessoa(String nome, String email) {
        this.nome = nome;
        this.email = email;
    }

    /** Cada filha informa seu tipo. Isso demonstra abstracao e sobrescrita. */
    public abstract String getTipoPessoa();

    /** O metodo da filha e chamado mesmo quando a referencia e Pessoa. */
    @Override
    public String toString() {
        return getTipoPessoa() + ": " + nome;
    }

    public Long getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
