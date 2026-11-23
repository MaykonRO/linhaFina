package br.com.linhafina.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;

/** Campos aceitos na secao atelie; campos ausentes preservam o valor atual. */
public class AtelieConfiguracaoRequest {

    @Size(max = 160, message = "O nome do ateliê deve ter no máximo 160 caracteres.")
    private String nome;

    @Size(max = 40, message = "O telefone deve ter no máximo 40 caracteres.")
    private String telefone;

    @Email(message = "Informe um e-mail válido para o ateliê.")
    @Size(max = 254, message = "O e-mail deve ter no máximo 254 caracteres.")
    private String email;

    @Size(max = 120, message = "A cidade deve ter no máximo 120 caracteres.")
    private String cidade;

    @Size(max = 300, message = "O endereço deve ter no máximo 300 caracteres.")
    private String endereco;

    @Size(max = 120, message = "O Instagram deve ter no máximo 120 caracteres.")
    private String instagram;

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getCidade() { return cidade; }
    public void setCidade(String cidade) { this.cidade = cidade; }
    public String getEndereco() { return endereco; }
    public void setEndereco(String endereco) { this.endereco = endereco; }
    public String getInstagram() { return instagram; }
    public void setInstagram(String instagram) { this.instagram = instagram; }
}
