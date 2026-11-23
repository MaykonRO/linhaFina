package br.com.linhafina.service;

import br.com.linhafina.dto.PrazoImpactoResponse;
import br.com.linhafina.dto.PrevisaoPrazoResponse;
import br.com.linhafina.model.OrdemServico;
import br.com.linhafina.model.StatusOrdem;
import br.com.linhafina.repository.OrdemServicoRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Objects;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class PrazoService {

    private static final List<StatusOrdem> EM_EXECUCAO = List.of(
            StatusOrdem.AGUARDANDO, StatusOrdem.PRODUCAO, StatusOrdem.PROVA);

    private final OrdemServicoRepository ordemRepository;
    private final ConfiguracaoService configuracaoService;
    private final int capacidadeHorasDia;

    public PrazoService(
            OrdemServicoRepository ordemRepository,
            ConfiguracaoService configuracaoService,
            @Value("${atelie.capacidade-horas-dia:8}") int capacidadeHorasDia) {
        if (capacidadeHorasDia <= 0) throw new IllegalArgumentException("A capacidade diaria deve ser positiva.");
        this.ordemRepository = ordemRepository;
        this.configuracaoService = configuracaoService;
        this.capacidadeHorasDia = capacidadeHorasDia;
    }

    @Transactional(readOnly = true)
    public PrevisaoPrazoResponse previsualizar(OrdemServico nova) {
        return simular(nova, false).previsao;
    }

    @Transactional
    public List<PrazoImpactoResponse> recalcularFila(OrdemServico nova) {
        Resultado resultado = simular(nova, true);
        ordemRepository.saveAll(resultado.fila);
        return resultado.impactos;
    }

    public LocalDate previsaoAposFalta(OrdemServico os, LocalDate novaProva) {
        LocalDate recalculada = somarDiasUteis(novaProva, os.getServico().getTempoEstimadoDias());
        if (os.getDataPrevistaEntrega() != null && recalculada.isBefore(os.getDataPrevistaEntrega())) {
            return os.getDataPrevistaEntrega();
        }
        return recalculada;
    }

    public boolean diaFechado(LocalDate data) {
        return configuracaoService.diaFechado(data);
    }

    private Resultado simular(OrdemServico nova, boolean alterarDatas) {
        List<OrdemServico> fila = new ArrayList<>(ordemRepository
                .findByStatusInOrderByDataEntradaAscCriadoEmAsc(EM_EXECUCAO).stream()
                .filter(os -> !Objects.equals(os.getId(), nova.getId()))
                .filter(os -> mesmaFila(os, nova))
                .toList());
        fila.add(nova);
        fila.sort(Comparator
                .comparing((OrdemServico os) -> !Boolean.TRUE.equals(os.getUrgente()))
                .thenComparing(OrdemServico::getDataEntrada)
                .thenComparing(OrdemServico::getCriadoEm, Comparator.nullsLast(Comparator.naturalOrder())));

        int horasAcumuladas = 0;
        int horasAntesDaNova = 0;
        int diasDaNova = 0;
        LocalDate dataDaNova = null;
        List<PrazoImpactoResponse> impactos = new ArrayList<>();

        for (OrdemServico os : fila) {
            if (os == nova) horasAntesDaNova = horasAcumuladas;
            int horas = horasDe(os);
            int dias = (int) Math.ceil((horasAcumuladas + horas) / (double) capacidadeHorasDia);
            LocalDate novaData = somarDiasUteis(os.getDataEntrada(), dias);
            LocalDate anterior = os.getDataPrevistaEntrega();

            if (alterarDatas) os.setDataPrevistaEntrega(novaData);
            if (os != nova && !Objects.equals(anterior, novaData)) {
                impactos.add(new PrazoImpactoResponse(String.valueOf(os.getId()), os.getCodigo(), anterior, novaData));
            }
            if (os == nova) {
                diasDaNova = dias;
                dataDaNova = novaData;
            }
            horasAcumuladas += horas;
        }

        PrevisaoPrazoResponse previsao = new PrevisaoPrazoResponse(
                dataDaNova, horasAntesDaNova, horasDe(nova), diasDaNova, impactos);
        return new Resultado(previsao, fila, impactos);
    }

    private boolean mesmaFila(OrdemServico existente, OrdemServico nova) {
        // Com responsavel, a fila e individual. Sem responsavel, usa a fila geral do atelie.
        if (nova.getResponsavel() == null) return true;
        return existente.getResponsavel() != null
                && Objects.equals(existente.getResponsavel().getId(), nova.getResponsavel().getId());
    }

    private int horasDe(OrdemServico os) {
        Integer horas = os.getServico().getTempoEstimadoHoras();
        if (horas == null || horas <= 0) horas = os.getServico().getTempoEstimadoDias() * 8;
        return horas;
    }

    private LocalDate somarDiasUteis(LocalDate entrada, int quantidadeDias) {
        LocalDate data = entrada;
        while (diaFechado(data)) data = data.plusDays(1);
        int diasRestantes = Math.max(quantidadeDias - 1, 0);
        while (diasRestantes > 0) {
            data = data.plusDays(1);
            if (!diaFechado(data)) diasRestantes--;
        }
        return data;
    }

    private static class Resultado {
        private final PrevisaoPrazoResponse previsao;
        private final List<OrdemServico> fila;
        private final List<PrazoImpactoResponse> impactos;

        private Resultado(PrevisaoPrazoResponse previsao, List<OrdemServico> fila, List<PrazoImpactoResponse> impactos) {
            this.previsao = previsao;
            this.fila = fila;
            this.impactos = impactos;
        }
    }
}
