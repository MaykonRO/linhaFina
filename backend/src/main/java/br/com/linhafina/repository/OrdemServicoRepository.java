package br.com.linhafina.repository;

import br.com.linhafina.model.OrdemServico;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrdemServicoRepository extends JpaRepository<OrdemServico, Long> {

    boolean existsByClienteId(Long clienteId);
}
