package br.com.linhafina.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ClienteRequest {

    @NotBlank(message = "Informe o nome da cliente")
    @Size(max = 120, message = "O nome deve ter no maximo 120 caracteres")
    private String nome;

    @NotBlank(message = "Informe o telefone da cliente")
    @Size(max = 20, message = "O telefone deve ter no maximo 20 caracteres")
    private String telefone;

    @Email(message = "Informe um e-mail valido")
    @Size(max = 160, message = "O e-mail deve ter no maximo 160 caracteres")
    private String email;

    public String getNome() {
        return nome;
    }

    public void setNome(String nome) {
        this.nome = nome;
    }

    public String getTelefone() {
        return telefone;
    }

    public void setTelefone(String telefone) {
        this.telefone = telefone;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }
}
