package br.com.linhafina.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

/**
 * Preferencias gerais do atelie. O servico utiliza sempre o id 1, pois existe
 * apenas uma configuracao para toda a aplicacao.
 */
@Entity
@Table(name = "configuracoes")
public class Configuracao {

    @Id
    private Long id;

    @Column(nullable = false, length = 160)
    private String nome = "";

    @Column(nullable = false, length = 40)
    private String telefone = "";

    @Column(nullable = false, length = 254)
    private String email = "";

    @Column(nullable = false, length = 120)
    private String cidade = "";

    @Column(nullable = false, length = 300)
    private String endereco = "";

    @Column(nullable = false, length = 120)
    private String instagram = "";

    // NUMERIC sem escala fixa evita arredondar percentuais informados pela API.
    @Column(columnDefinition = "NUMERIC")
    private BigDecimal taxaUrgenciaPadrao;

    @Column(nullable = false)
    private Boolean fidelidadeAtivo = false;

    @Column(columnDefinition = "NUMERIC")
    private BigDecimal fidelidadeDescontoPercentual;

    private Integer fidelidadeServicosNecessarios;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String fidelidadeRegra = "";

    @Column(nullable = false)
    private Boolean notificacaoAtrasos = false;

    @Column(nullable = false)
    private Boolean notificacaoProvas = false;

    @Column(nullable = false)
    private Boolean notificacaoOrcamentosVencendo = false;

    @Column(nullable = false)
    private Boolean notificacaoResumoDiario = false;

    @Column(nullable = false)
    private Boolean compactarTabelas = false;

    @Column(nullable = false)
    private Boolean mostrarValores = true;

    public Configuracao() {
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
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
    public BigDecimal getTaxaUrgenciaPadrao() { return taxaUrgenciaPadrao; }
    public void setTaxaUrgenciaPadrao(BigDecimal taxaUrgenciaPadrao) { this.taxaUrgenciaPadrao = taxaUrgenciaPadrao; }
    public Boolean getFidelidadeAtivo() { return fidelidadeAtivo; }
    public void setFidelidadeAtivo(Boolean fidelidadeAtivo) { this.fidelidadeAtivo = fidelidadeAtivo; }
    public BigDecimal getFidelidadeDescontoPercentual() { return fidelidadeDescontoPercentual; }
    public void setFidelidadeDescontoPercentual(BigDecimal valor) { this.fidelidadeDescontoPercentual = valor; }
    public Integer getFidelidadeServicosNecessarios() { return fidelidadeServicosNecessarios; }
    public void setFidelidadeServicosNecessarios(Integer quantidade) { this.fidelidadeServicosNecessarios = quantidade; }
    public String getFidelidadeRegra() { return fidelidadeRegra; }
    public void setFidelidadeRegra(String fidelidadeRegra) { this.fidelidadeRegra = fidelidadeRegra; }
    public Boolean getNotificacaoAtrasos() { return notificacaoAtrasos; }
    public void setNotificacaoAtrasos(Boolean ativo) { this.notificacaoAtrasos = ativo; }
    public Boolean getNotificacaoProvas() { return notificacaoProvas; }
    public void setNotificacaoProvas(Boolean ativo) { this.notificacaoProvas = ativo; }
    public Boolean getNotificacaoOrcamentosVencendo() { return notificacaoOrcamentosVencendo; }
    public void setNotificacaoOrcamentosVencendo(Boolean ativo) { this.notificacaoOrcamentosVencendo = ativo; }
    public Boolean getNotificacaoResumoDiario() { return notificacaoResumoDiario; }
    public void setNotificacaoResumoDiario(Boolean ativo) { this.notificacaoResumoDiario = ativo; }
    public Boolean getCompactarTabelas() { return compactarTabelas; }
    public void setCompactarTabelas(Boolean compactarTabelas) { this.compactarTabelas = compactarTabelas; }
    public Boolean getMostrarValores() { return mostrarValores; }
    public void setMostrarValores(Boolean mostrarValores) { this.mostrarValores = mostrarValores; }
}
