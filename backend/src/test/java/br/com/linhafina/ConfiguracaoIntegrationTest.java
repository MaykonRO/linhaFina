package br.com.linhafina;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.linhafina.repository.ConfiguracaoRepository;
import br.com.linhafina.repository.DiaDeFolgaRepository;
import br.com.linhafina.repository.HorarioAtendimentoRepository;
import br.com.linhafina.service.ConfiguracaoService;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(username = "admin@teste.local", roles = "DONO")
class ConfiguracaoIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ConfiguracaoRepository configuracoes;
    @Autowired HorarioAtendimentoRepository horarios;
    @Autowired DiaDeFolgaRepository folgas;
    @Autowired ConfiguracaoService service;

    @BeforeEach
    void limpar() {
        folgas.deleteAll();
        horarios.deleteAll();
        configuracoes.deleteAll();
    }

    @AfterEach
    void restaurar() {
        limpar();
    }

    @Test
    void deveInformarDefaultsSemInventarDadosDoAtelie() throws Exception {
        mvc.perform(get("/api/configuracoes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.atelie.nome").value(""))
                .andExpect(jsonPath("$.horario.length()").value(7))
                .andExpect(jsonPath("$.horario[0].ativo").doesNotExist())
                .andExpect(jsonPath("$.folgas.length()").value(0))
                .andExpect(jsonPath("$.taxaUrgenciaPadrao").value(20));
    }

    @Test
    void deveFazerMergeEPersistirSecoesIndependentes() throws Exception {
        mvc.perform(put("/api/configuracoes").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"atelie\":{\"nome\":\"Atelie de teste\",\"email\":\"atelie@teste.com\"}}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.atelie.nome").value("Atelie de teste"))
                .andExpect(jsonPath("$.atelie.cidade").value(""));
        mvc.perform(put("/api/configuracoes").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"taxaUrgenciaPadrao\":25}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.taxaUrgenciaPadrao").value(25))
                .andExpect(jsonPath("$.atelie.nome").value("Atelie de teste"));
        mvc.perform(get("/api/configuracoes"))
                .andExpect(jsonPath("$.atelie.nome").value("Atelie de teste"))
                .andExpect(jsonPath("$.taxaUrgenciaPadrao").value(25));
        mvc.perform(put("/api/configuracoes").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"taxaUrgenciaPadrao\":101}"))
                .andExpect(status().isUnprocessableEntity());
        mvc.perform(put("/api/configuracoes").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"secaoInventada\":true}"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void deveReconhecerFechamentoSemanalEFolgaEspecifica() throws Exception {
        mvc.perform(put("/api/configuracoes").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"horario\":[{\"id\":\"seg\",\"rotulo\":\"Segunda\",\"ativo\":false,\"abre\":\"\",\"fecha\":\"\"}]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.horario[0].ativo").value(false))
                .andExpect(jsonPath("$.horario[1].ativo").doesNotExist());
        LocalDate segunda = LocalDate.now().with(TemporalAdjusters.next(DayOfWeek.MONDAY));
        LocalDate terca = segunda.plusDays(1);
        assertThat(service.diaFechado(segunda)).isTrue();
        assertThat(service.diaFechado(terca)).isFalse();

        mvc.perform(put("/api/configuracoes").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"folgas\":[\"" + terca + "\"]}"))
                .andExpect(status().isOk());
        assertThat(service.diaFechado(terca)).isTrue();
        mvc.perform(put("/api/configuracoes").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"folgas\":[\"" + LocalDate.now().minusDays(1) + "\"]}"))
                .andExpect(status().isUnprocessableEntity());
    }
}
