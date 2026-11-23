package br.com.linhafina.repository;

import br.com.linhafina.model.DiaDeFolga;
import java.time.LocalDate;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DiaDeFolgaRepository extends JpaRepository<DiaDeFolga, LocalDate> {

    List<DiaDeFolga> findAllByOrderByDataAsc();
}
