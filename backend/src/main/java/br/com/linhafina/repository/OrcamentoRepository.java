package br.com.linhafina.repository;

import br.com.linhafina.model.Orcamento;
import br.com.linhafina.model.StatusOrcamento;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrcamentoRepository extends JpaRepository<Orcamento, Long> {
    boolean existsByClienteId(Long clienteId);
    boolean existsByServicoId(Long servicoId);
    List<Orcamento> findByStatusInAndValidadeBefore(Collection<StatusOrcamento> status, java.time.LocalDate data);
}
