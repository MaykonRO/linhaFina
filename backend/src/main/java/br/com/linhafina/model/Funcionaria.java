package br.com.linhafina.model;

import jakarta.persistence.Column;
import jakarta.persistence.DiscriminatorValue;
import jakarta.persistence.Entity;
import jakarta.persistence.PrimaryKeyJoinColumn;
import jakarta.persistence.Table;

@Entity
@Table(name = "funcionarias")
@PrimaryKeyJoinColumn(name = "id")
@DiscriminatorValue("FUNCIONARIA")
public class Funcionaria extends Pessoa {

    @Column(length = 80)
    private String cargo;

    @Column(length = 40)
    private String papel;

    @Column(nullable = false, length = 30)
    private String status = "disponivel";

    @Column(length = 160)
    private String especialidade;

    public Funcionaria() {
        super();
    }

    public Funcionaria(String nome, String cargo, String papel) {
        super(nome, null, null);
        this.cargo = cargo;
        this.papel = papel;
    }

    @Override
    public String getTipoPessoa() {
        return "Funcionaria";
    }

    public String getCargo() { return cargo; }
    public void setCargo(String cargo) { this.cargo = cargo; }
    public String getPapel() { return papel; }
    public void setPapel(String papel) { this.papel = papel; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getEspecialidade() { return especialidade; }
    public void setEspecialidade(String especialidade) { this.especialidade = especialidade; }
}
