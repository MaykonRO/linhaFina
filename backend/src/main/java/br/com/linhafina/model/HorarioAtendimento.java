package br.com.linhafina.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalTime;

/** Horario de um dia da semana. O id varia de seg ate dom. */
@Entity
@Table(name = "horarios_atendimento")
public class HorarioAtendimento {

    @Id
    @Column(length = 3)
    private String id;

    @Column(nullable = false, length = 20)
    private String rotulo;

    // Null significa que o usuario ainda nao informou se o atelie abre.
    private Boolean ativo;

    private LocalTime abre;
    private LocalTime fecha;

    public HorarioAtendimento() {
    }

    public HorarioAtendimento(String id, String rotulo) {
        this.id = id;
        this.rotulo = rotulo;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }
    public String getRotulo() { return rotulo; }
    public void setRotulo(String rotulo) { this.rotulo = rotulo; }
    public Boolean getAtivo() { return ativo; }
    public void setAtivo(Boolean ativo) { this.ativo = ativo; }
    public LocalTime getAbre() { return abre; }
    public void setAbre(LocalTime abre) { this.abre = abre; }
    public LocalTime getFecha() { return fecha; }
    public void setFecha(LocalTime fecha) { this.fecha = fecha; }
}
