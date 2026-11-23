package br.com.linhafina.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class ClienteRequest {

    @NotBlank(groups = Criacao.class, message = "Informe o nome da cliente")
    @Size(max = 120, message = "O nome deve ter no maximo 120 caracteres")
    private String nome;

    @NotBlank(groups = Criacao.class, message = "Informe o telefone da cliente")
    private String telefone;

    @Email(message = "Informe um e-mail valido")
    @Size(max = 160, message = "O e-mail deve ter no maximo 160 caracteres")
    private String email;

    @Size(max = 100, message = "A cidade deve ter no maximo 100 caracteres")
    private String cidade;
    private String observacoes;

    @Valid
    private FichaMedidasRequest medidas;

    public String getNome() { return nome; }
    public void setNome(String nome) { this.nome = nome; }
    public String getTelefone() { return telefone; }
    public void setTelefone(String telefone) { this.telefone = telefone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getCidade() { return cidade; }
    public void setCidade(String cidade) { this.cidade = cidade; }
    public String getObservacoes() { return observacoes; }
    public void setObservacoes(String observacoes) { this.observacoes = observacoes; }
    public FichaMedidasRequest getMedidas() { return medidas; }
    public void setMedidas(FichaMedidasRequest medidas) { this.medidas = medidas; }
}
