package br.com.linhafina.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;

/** A data e a chave primaria, impedindo folgas duplicadas no banco. */
@Entity
@Table(name = "dias_de_folga")
public class DiaDeFolga {

    @Id
    private LocalDate data;

    public DiaDeFolga() {
    }

    public DiaDeFolga(LocalDate data) {
        this.data = data;
    }

    public LocalDate getData() { return data; }
    public void setData(LocalDate data) { this.data = data; }
}
