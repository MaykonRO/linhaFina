package br.com.linhafina.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class LoginRequest {

    @NotBlank(message = "Informe o e-mail")
    @Email(message = "Informe um e-mail valido")
    private String email;

    @NotBlank(message = "Informe a senha")
    private String senha;

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getSenha() { return senha; }
    public void setSenha(String senha) { this.senha = senha; }
}
