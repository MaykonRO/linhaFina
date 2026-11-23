package br.com.linhafina.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class FuncionariaRequest {

    @NotBlank(message = "Informe o nome da funcionaria") @Size(max = 120) private String nome;
    private String telefone;
    @Email(message = "Informe um e-mail valido") private String email;
    private String cargo;
    private String papel;
    private String status = "disponivel";
    private String especialidade;

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getCargo() { return cargo; }
    public void setCargo(String cargo) { this.cargo = cargo; }
    public String getPapel() { return papel; }
    public void setPapel(String papel) { this.papel = papel; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getEspecialidade() { return especialidade; }
    public void setEspecialidade(String especialidade) { this.especialidade = especialidade; }
}
