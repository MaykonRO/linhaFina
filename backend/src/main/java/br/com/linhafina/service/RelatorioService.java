package br.com.linhafina.service;

import br.com.linhafina.model.OrdemServico;
import br.com.linhafina.model.StatusOrdem;
import br.com.linhafina.repository.OrdemServicoRepository;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RelatorioService {

    private final OrdemServicoRepository ordemRepository;

    public RelatorioService(OrdemServicoRepository ordemRepository) {
        this.ordemRepository = ordemRepository;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> resumo(LocalDate de, LocalDate ate) {
        List<OrdemServico> validas = periodo(de, ate).stream().filter(os -> os.getStatus() != StatusOrdem.CANCELADA).toList();
        BigDecimal faturamento = somar(validas);
        BigDecimal recebido = validas.stream().map(OrdemServico::getValorPago).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal aReceber = validas.stream()
                .map(os -> os.getValorFinal().subtract(os.getValorPago()).max(BigDecimal.ZERO))
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        Map<Long, Map<String, Object>> agrupado = new LinkedHashMap<>();
        for (OrdemServico os : validas) {
            Long servicoId = os.getServico().getId();
            Map<String, Object> item = agrupado.computeIfAbsent(servicoId, id -> {
                Map<String, Object> novo = new LinkedHashMap<>();
                novo.put("servicoId", String.valueOf(id));
                novo.put("nome", os.getServico().getNome());
                novo.put("categoria", os.getServico().getCategoria());
                novo.put("quantidade", 0);
                novo.put("valor", BigDecimal.ZERO);
                return novo;
            });
            item.put("quantidade", (int) item.get("quantidade") + 1);
            item.put("valor", ((BigDecimal) item.get("valor")).add(os.getValorFinal()));
        }
        List<Map<String, Object>> ranking = new ArrayList<>(agrupado.values());
        ranking.sort(Comparator.comparing((Map<String, Object> item) -> (int) item.get("quantidade")).reversed()
                .thenComparing(item -> (BigDecimal) item.get("valor"), Comparator.reverseOrder()));

        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("faturamento", faturamento);
        resposta.put("recebido", recebido);
        resposta.put("aReceber", aReceber);
        resposta.put("totalOrdens", validas.size());
        resposta.put("ticketMedio", validas.isEmpty() ? BigDecimal.ZERO : faturamento.divide(BigDecimal.valueOf(validas.size()), 2, RoundingMode.HALF_UP));
        resposta.put("rankingServicos", ranking);
        return resposta;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> entregas(LocalDate de, LocalDate ate) {
        List<OrdemServico> entregues = periodo(de, ate).stream()
                .filter(os -> os.getStatus() == StatusOrdem.ENTREGUE && os.getDataEntrega() != null).toList();
        long noPrazo = entregues.stream().filter(os -> !os.getDataEntrega().isAfter(os.getDataPrevistaEntrega())).count();
        double medio = entregues.stream().mapToLong(os -> ChronoUnit.DAYS.between(os.getDataEntrada(), os.getDataEntrega())).average().orElse(0);
        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("total", entregues.size());
        resposta.put("noPrazo", noPrazo);
        resposta.put("atrasadas", entregues.size() - noPrazo);
        resposta.put("indiceNoPrazo", entregues.isEmpty() ? 0 : (double) noPrazo / entregues.size());
        resposta.put("prazoMedioDias", Math.round(medio));
        return resposta;
    }

    @Transactional(readOnly = true)
    public List<Map<String, Object>> produtividade(LocalDate de, LocalDate ate) {
        Map<Long, Map<String, Object>> equipe = new LinkedHashMap<>();
        for (OrdemServico os : periodo(de, ate)) {
            if (os.getResponsavel() == null || os.getStatus() == StatusOrdem.CANCELADA) continue;
            Long id = os.getResponsavel().getId();
            Map<String, Object> item = equipe.computeIfAbsent(id, chave -> {
                Map<String, Object> novo = new LinkedHashMap<>();
                novo.put("funcionariaId", String.valueOf(chave));
                novo.put("nome", os.getResponsavel().getNome());
                novo.put("cargo", os.getResponsavel().getCargo());
                novo.put("osAtivas", 0);
                novo.put("entregues", 0);
                novo.put("horasPendentes", 0);
                novo.put("valor", BigDecimal.ZERO);
                return novo;
            });
            if (os.getStatus().estaAberta()) {
                item.put("osAtivas", (int) item.get("osAtivas") + 1);
                item.put("horasPendentes", (int) item.get("horasPendentes") + os.getServico().getTempoEstimadoHoras());
            }
            if (os.getStatus() == StatusOrdem.ENTREGUE) item.put("entregues", (int) item.get("entregues") + 1);
            item.put("valor", ((BigDecimal) item.get("valor")).add(os.getValorFinal()));
        }
        return new ArrayList<>(equipe.values());
    }

    private List<OrdemServico> periodo(LocalDate de, LocalDate ate) {
        return ordemRepository.findAll().stream()
                .filter(os -> de == null || !os.getDataEntrada().isBefore(de))
                .filter(os -> ate == null || !os.getDataEntrada().isAfter(ate))
                .toList();
    }

    private BigDecimal somar(List<OrdemServico> ordens) {
        return ordens.stream().map(OrdemServico::getValorFinal).reduce(BigDecimal.ZERO, BigDecimal::add);
    }
}
