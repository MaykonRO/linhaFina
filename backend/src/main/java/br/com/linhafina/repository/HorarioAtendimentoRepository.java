package br.com.linhafina.repository;

import br.com.linhafina.model.HorarioAtendimento;
import org.springframework.data.jpa.repository.JpaRepository;

public interface HorarioAtendimentoRepository extends JpaRepository<HorarioAtendimento, String> {
}
