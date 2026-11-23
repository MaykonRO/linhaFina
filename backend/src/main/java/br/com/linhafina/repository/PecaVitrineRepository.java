package br.com.linhafina.repository;

import br.com.linhafina.model.PecaVitrine;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PecaVitrineRepository extends JpaRepository<PecaVitrine, Long> {
    List<PecaVitrine> findByAtivoTrueOrderByDestaqueDescNomeAsc();
}
