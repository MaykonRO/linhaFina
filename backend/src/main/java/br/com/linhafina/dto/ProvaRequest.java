package br.com.linhafina.dto;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;

public class ProvaRequest {
    @NotNull(message = "Informe se a cliente compareceu") private Boolean compareceu;
    private LocalDate novaDataProva;
    public Boolean getCompareceu() { return compareceu; }
    public void setCompareceu(Boolean compareceu) { this.compareceu = compareceu; }
    public LocalDate getNovaDataProva() { return novaDataProva; }
    public void setNovaDataProva(LocalDate novaDataProva) { this.novaDataProva = novaDataProva; }
}
