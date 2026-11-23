package br.com.linhafina.repository;

import br.com.linhafina.model.Funcionaria;
import org.springframework.data.jpa.repository.JpaRepository;

public interface FuncionariaRepository extends JpaRepository<Funcionaria, Long> {
}
