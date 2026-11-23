package br.com.linhafina.repository;

import br.com.linhafina.model.OrdemServico;
import br.com.linhafina.model.StatusOrdem;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface OrdemServicoRepository extends JpaRepository<OrdemServico, Long> {

    boolean existsByClienteId(Long clienteId);
    long countByClienteIdAndStatus(Long clienteId, StatusOrdem status);
    boolean existsByServicoId(Long servicoId);
    boolean existsByResponsavelId(Long responsavelId);
    boolean existsByClienteIdAndStatusIn(Long clienteId, Collection<StatusOrdem> status);
    List<OrdemServico> findByStatusInOrderByDataEntradaAscCriadoEmAsc(Collection<StatusOrdem> status);
    List<OrdemServico> findByClienteIdOrderByDataEntradaDesc(Long clienteId);
    List<OrdemServico> findByResponsavelIdAndStatusInOrderByDataEntradaAscCriadoEmAsc(Long responsavelId, Collection<StatusOrdem> status);
}
