package br.com.linhafina.service;

import br.com.linhafina.dto.PagamentoResponse;
import br.com.linhafina.repository.PagamentoRepository;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PagamentoService {
    private final PagamentoRepository repository;

    public PagamentoService(PagamentoRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<PagamentoResponse> listar() {
        return repository.findAll().stream()
                .sorted(Comparator.comparing(br.com.linhafina.model.Pagamento::getDataPagamento).reversed()
                        .thenComparing(br.com.linhafina.model.Pagamento::getId, Comparator.reverseOrder()))
                .map(PagamentoResponse::new).toList();
    }
}
