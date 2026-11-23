package br.com.linhafina.model;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.OneToOne;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;

@Entity
@Table(name = "clientes")
@PrimaryKeyJoinColumn(name = "id")
@DiscriminatorValue("CLIENTE")
public class Cliente extends Pessoa {

    @Column(length = 100)
    private String cidade;

    @Column(columnDefinition = "TEXT")
    private String observacoes;

    @OneToOne(mappedBy = "cliente", cascade = CascadeType.ALL, orphanRemoval = true)
    private FichaMedidas medidas;

    public Cliente() {
        super();
    }

    public Cliente(String nome, String telefone, String email, String cidade) {
        super(nome, telefone, email);
        this.cidade = cidade;
    }

    @Override
    public String getTipoPessoa() {
        return "Cliente";
    }

    public void setMedidas(FichaMedidas medidas) {
        this.medidas = medidas;
        if (medidas != null) {
            medidas.setCliente(this);
        }
    }

    public String getCidade() { return cidade; }
    public void setCidade(String cidade) { this.cidade = cidade; }
    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
    public FichaMedidas getMedidas() { return medidas; }
}
