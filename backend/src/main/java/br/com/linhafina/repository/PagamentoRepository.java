package br.com.linhafina.repository;

import br.com.linhafina.model.Pagamento;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PagamentoRepository extends JpaRepository<Pagamento, Long> {
    List<Pagamento> findByOrdemServicoIdOrderByDataPagamentoDesc(Long ordemServicoId);
}
