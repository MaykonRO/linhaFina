package br.com.linhafina.service;

import br.com.linhafina.dto.AtelieConfiguracaoRequest;
import br.com.linhafina.dto.FidelidadeConfiguracaoRequest;
import br.com.linhafina.dto.HorarioAtendimentoRequest;
import br.com.linhafina.dto.InterfaceConfiguracaoRequest;
import br.com.linhafina.dto.NotificacoesConfiguracaoRequest;
import br.com.linhafina.exception.RegraNegocioException;
import br.com.linhafina.model.Configuracao;
import br.com.linhafina.model.DiaDeFolga;
import br.com.linhafina.model.HorarioAtendimento;
import br.com.linhafina.repository.ConfiguracaoRepository;
import br.com.linhafina.repository.DiaDeFolgaRepository;
import br.com.linhafina.repository.HorarioAtendimentoRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Validator;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ConfiguracaoService {

    private static final long ID = 1L;
    private static final List<String> IDS_DIAS = List.of("seg", "ter", "qua", "qui", "sex", "sab", "dom");
    private static final List<String> ROTULOS_DIAS = List.of("Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado", "Domingo");
    private static final List<String> ORDEM_JAVA = List.of("dom", "seg", "ter", "qua", "qui", "sex", "sab");
    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

    private final ConfiguracaoRepository configuracaoRepository;
    private final HorarioAtendimentoRepository horarioRepository;
    private final DiaDeFolgaRepository folgaRepository;
    private final ObjectMapper mapper;
    private final Validator validator;
    private final BigDecimal taxaInicial;

    public ConfiguracaoService(
            ConfiguracaoRepository configuracaoRepository,
            HorarioAtendimentoRepository horarioRepository,
            DiaDeFolgaRepository folgaRepository,
            ObjectMapper mapper,
            Validator validator,
            @Value("${atelie.taxa-urgencia-padrao:20}") BigDecimal taxaInicial) {
        this.configuracaoRepository = configuracaoRepository;
        this.horarioRepository = horarioRepository;
        this.folgaRepository = folgaRepository;
        this.mapper = mapper;
        this.validator = validator;
        this.taxaInicial = taxaInicial;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> buscar() {
        Configuracao config = configuracaoRepository.findById(ID).orElseGet(this::novaConfiguracao);
        Map<String, Object> resposta = new LinkedHashMap<>();
        resposta.put("atelie", mapaAtelie(config));
        resposta.put("horario", montarHorarios());
        resposta.put("folgas", folgaRepository.findAllByOrderByDataAsc().stream().map(f -> f.getData().toString()).toList());
        resposta.put("taxaUrgenciaPadrao", config.getTaxaUrgenciaPadrao() == null ? taxaInicial : config.getTaxaUrgenciaPadrao());
        resposta.put("fidelidade", mapaFidelidade(config));
        resposta.put("notificacoes", mapaNotificacoes(config));
        resposta.put("interface", mapaInterface(config));
        return resposta;
    }

    @Transactional
    public Map<String, Object> atualizar(Map<String, Object> alteracoes) {
        if (alteracoes == null || alteracoes.isEmpty()) throw new RegraNegocioException("Informe uma secao de configuracao.");
        Set<String> permitidas = Set.of("atelie", "horario", "folgas", "taxaUrgenciaPadrao", "fidelidade", "notificacoes", "interface");
        for (String secao : alteracoes.keySet()) {
            if (!permitidas.contains(secao)) throw new RegraNegocioException("Secao de configuracao desconhecida: " + secao);
        }
        Configuracao config = configuracaoRepository.findById(ID).orElseGet(this::novaConfiguracao);
        for (var entrada : alteracoes.entrySet()) {
            switch (entrada.getKey()) {
                case "atelie" -> atualizarAtelie(config, entrada.getValue());
                case "horario" -> atualizarHorarios(entrada.getValue());
                case "folgas" -> atualizarFolgas(entrada.getValue());
                case "taxaUrgenciaPadrao" -> config.setTaxaUrgenciaPadrao(percentual(entrada.getValue(), "A taxa de urgencia"));
                case "fidelidade" -> atualizarFidelidade(config, entrada.getValue());
                case "notificacoes" -> atualizarNotificacoes(config, entrada.getValue());
                case "interface" -> atualizarInterface(config, entrada.getValue());
                default -> { }
            }
        }
        configuracaoRepository.save(config);
        return buscar();
    }

    @Transactional(readOnly = true)
    public boolean diaFechado(LocalDate data) {
        if (folgaRepository.existsById(data)) return true;
        String id = ORDEM_JAVA.get(data.getDayOfWeek().getValue() % 7);
        return horarioRepository.findById(id).map(h -> h.getAtivo() != null && !h.getAtivo()).orElse(false);
    }

    @Transactional(readOnly = true)
    public Map<String, Object> obterFidelidade() {
        Configuracao config = configuracaoRepository.findById(ID).orElseGet(this::novaConfiguracao);
        return mapaFidelidade(config);
    }

    @Transactional(readOnly = true)
    public BigDecimal obterTaxaUrgenciaPadrao() {
        return configuracaoRepository.findById(ID)
                .map(Configuracao::getTaxaUrgenciaPadrao)
                .orElse(taxaInicial);
    }

    private Configuracao novaConfiguracao() {
        Configuracao config = new Configuracao();
        config.setId(ID);
        config.setTaxaUrgenciaPadrao(taxaInicial);
        return config;
    }

    private void atualizarAtelie(Configuracao config, Object valor) {
        AtelieConfiguracaoRequest request = converter(valor, AtelieConfiguracaoRequest.class);
        validar(request);
        if (request.getNome() != null) config.setNome(request.getNome().trim());
        if (request.getTelefone() != null) config.setTelefone(request.getTelefone().trim());
        if (request.getEmail() != null) config.setEmail(request.getEmail().trim());
        if (request.getCidade() != null) config.setCidade(request.getCidade().trim());
        if (request.getEndereco() != null) config.setEndereco(request.getEndereco().trim());
        if (request.getInstagram() != null) config.setInstagram(request.getInstagram().trim());
    }

    private void atualizarHorarios(Object valor) {
        List<HorarioAtendimentoRequest> itens = mapper.convertValue(valor, new TypeReference<>() { });
        if (itens == null || itens.isEmpty()) throw new RegraNegocioException("Informe os horarios do atelie.");
        Set<String> recebidos = new HashSet<>();
        for (HorarioAtendimentoRequest request : itens) {
            validar(request);
            int indice = IDS_DIAS.indexOf(request.getId());
            if (indice < 0 || !recebidos.add(request.getId())) throw new RegraNegocioException("Dia da semana invalido ou repetido.");
            HorarioAtendimento horario = horarioRepository.findById(request.getId())
                    .orElseGet(() -> new HorarioAtendimento(request.getId(), ROTULOS_DIAS.get(indice)));
            horario.setRotulo(request.getRotulo() == null || request.getRotulo().isBlank() ? ROTULOS_DIAS.get(indice) : request.getRotulo().trim());
            LocalTime abre = hora(request.getAbre());
            LocalTime fecha = hora(request.getFecha());
            if (Boolean.TRUE.equals(request.getAtivo())) {
                if (abre == null || fecha == null) throw new RegraNegocioException("Informe abertura e fechamento para " + horario.getRotulo() + ".");
                if (!abre.isBefore(fecha)) throw new RegraNegocioException("A abertura deve ser anterior ao fechamento em " + horario.getRotulo() + ".");
            }
            horario.setAtivo(request.getAtivo());
            horario.setAbre(abre);
            horario.setFecha(fecha);
            horarioRepository.save(horario);
        }
    }

    private void atualizarFolgas(Object valor) {
        List<String> textos = mapper.convertValue(valor, new TypeReference<>() { });
        if (textos == null) throw new RegraNegocioException("A lista de folgas e invalida.");
        Set<LocalDate> datas = new HashSet<>();
        for (String texto : textos) {
            try {
                LocalDate data = LocalDate.parse(texto);
                if (data.isBefore(LocalDate.now())) throw new RegraNegocioException("Nao e possivel cadastrar folga no passado.");
                if (!datas.add(data)) throw new RegraNegocioException("A mesma folga foi informada mais de uma vez.");
            } catch (DateTimeParseException erro) {
                throw new RegraNegocioException("Use o formato AAAA-MM-DD para as folgas.");
            }
        }
        folgaRepository.deleteAll();
        folgaRepository.saveAll(datas.stream().sorted().map(DiaDeFolga::new).toList());
    }

    private void atualizarFidelidade(Configuracao config, Object valor) {
        FidelidadeConfiguracaoRequest request = converter(valor, FidelidadeConfiguracaoRequest.class);
        validar(request);
        if (request.getAtivo() != null) config.setFidelidadeAtivo(request.getAtivo());
        if (request.getDescontoPercentual() != null) config.setFidelidadeDescontoPercentual(request.getDescontoPercentual());
        if (request.getServicosNecessarios() != null) config.setFidelidadeServicosNecessarios(request.getServicosNecessarios());
        if (request.getRegra() != null) config.setFidelidadeRegra(request.getRegra().trim());
    }

    private void atualizarNotificacoes(Configuracao config, Object valor) {
        NotificacoesConfiguracaoRequest request = converter(valor, NotificacoesConfiguracaoRequest.class);
        if (request.getAtrasos() != null) config.setNotificacaoAtrasos(request.getAtrasos());
        if (request.getProvas() != null) config.setNotificacaoProvas(request.getProvas());
        if (request.getOrcamentosVencendo() != null) config.setNotificacaoOrcamentosVencendo(request.getOrcamentosVencendo());
        if (request.getResumoDiario() != null) config.setNotificacaoResumoDiario(request.getResumoDiario());
    }

    private void atualizarInterface(Configuracao config, Object valor) {
        InterfaceConfiguracaoRequest request = converter(valor, InterfaceConfiguracaoRequest.class);
        if (request.getCompactarTabelas() != null) config.setCompactarTabelas(request.getCompactarTabelas());
        if (request.getMostrarValores() != null) config.setMostrarValores(request.getMostrarValores());
    }

    private BigDecimal percentual(Object valor, String nome) {
        try {
            BigDecimal numero = new BigDecimal(String.valueOf(valor));
            if (numero.compareTo(BigDecimal.ZERO) < 0 || numero.compareTo(new BigDecimal("100")) > 0) {
                throw new RegraNegocioException(nome + " deve estar entre 0 e 100.");
            }
            return numero;
        } catch (NumberFormatException erro) {
            throw new RegraNegocioException(nome + " deve ser numerica.");
        }
    }

    private LocalTime hora(String texto) {
        if (texto == null || texto.isBlank()) return null;
        try {
            return LocalTime.parse(texto, HORA);
        } catch (DateTimeParseException erro) {
            throw new RegraNegocioException("Use o formato HH:mm para os horarios.");
        }
    }

    private <T> T converter(Object valor, Class<T> tipo) {
        try {
            return mapper.convertValue(valor, tipo);
        } catch (IllegalArgumentException erro) {
            throw new RegraNegocioException("A secao de configuracao possui formato invalido.");
        }
    }

    private void validar(Object request) {
        var violacoes = validator.validate(request);
        if (!violacoes.isEmpty()) throw new RegraNegocioException(violacoes.iterator().next().getMessage());
    }

    private Map<String, Object> mapaAtelie(Configuracao c) {
        Map<String, Object> mapa = new LinkedHashMap<>();
        mapa.put("nome", c.getNome()); mapa.put("telefone", c.getTelefone()); mapa.put("email", c.getEmail());
        mapa.put("cidade", c.getCidade()); mapa.put("endereco", c.getEndereco()); mapa.put("instagram", c.getInstagram());
        return mapa;
    }

    private List<Map<String, Object>> montarHorarios() {
        Map<String, HorarioAtendimento> salvos = new HashMap<>();
        for (HorarioAtendimento h : horarioRepository.findAll()) salvos.put(h.getId(), h);
        List<Map<String, Object>> lista = new ArrayList<>();
        for (int i = 0; i < IDS_DIAS.size(); i++) {
            String id = IDS_DIAS.get(i);
            HorarioAtendimento h = salvos.get(id);
            Map<String, Object> mapa = new LinkedHashMap<>();
            mapa.put("id", id); mapa.put("rotulo", h == null ? ROTULOS_DIAS.get(i) : h.getRotulo());
            mapa.put("ativo", h == null ? null : h.getAtivo());
            mapa.put("abre", h == null || h.getAbre() == null ? "" : HORA.format(h.getAbre()));
            mapa.put("fecha", h == null || h.getFecha() == null ? "" : HORA.format(h.getFecha()));
            lista.add(mapa);
        }
        return lista;
    }

    private Map<String, Object> mapaFidelidade(Configuracao c) {
        Map<String, Object> mapa = new LinkedHashMap<>();
        mapa.put("ativo", c.getFidelidadeAtivo()); mapa.put("descontoPercentual", c.getFidelidadeDescontoPercentual());
        mapa.put("servicosNecessarios", c.getFidelidadeServicosNecessarios()); mapa.put("regra", c.getFidelidadeRegra());
        return mapa;
    }

    private Map<String, Object> mapaNotificacoes(Configuracao c) {
        Map<String, Object> mapa = new LinkedHashMap<>();
        mapa.put("atrasos", c.getNotificacaoAtrasos()); mapa.put("provas", c.getNotificacaoProvas());
        mapa.put("orcamentosVencendo", c.getNotificacaoOrcamentosVencendo()); mapa.put("resumoDiario", c.getNotificacaoResumoDiario());
        return mapa;
    }

    private Map<String, Object> mapaInterface(Configuracao c) {
        Map<String, Object> mapa = new LinkedHashMap<>();
        mapa.put("compactarTabelas", c.getCompactarTabelas()); mapa.put("mostrarValores", c.getMostrarValores());
        return mapa;
    }
}
