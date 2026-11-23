package br.com.linhafina;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.linhafina.repository.ClienteRepository;
import br.com.linhafina.repository.FuncionariaRepository;
import br.com.linhafina.repository.OrdemServicoRepository;
import br.com.linhafina.repository.OrcamentoRepository;
import br.com.linhafina.repository.PagamentoRepository;
import br.com.linhafina.repository.ServicoRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(username = "admin@teste.local", roles = "DONO")
class PrazoIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired ClienteRepository clientes;
    @Autowired FuncionariaRepository funcionarias;
    @Autowired ServicoRepository servicos;
    @Autowired OrdemServicoRepository ordens;
    @Autowired OrcamentoRepository orcamentos;
    @Autowired PagamentoRepository pagamentos;

    private String clienteId;
    private String servicoId;

    @BeforeEach
    void preparar() throws Exception {
        pagamentos.deleteAll();
        orcamentos.deleteAll();
        ordens.deleteAll();
        clientes.deleteAll();
        funcionarias.deleteAll();
        servicos.deleteAll();
        limparFolgas();
        clienteId = criar("/api/clientes", "{\"nome\":\"Cliente Prazo\",\"telefone\":\"11999999999\",\"email\":\"prazo@teste.com\"}").get("id").asText();
        servicoId = criar("/api/servicos", "{\"nome\":\"Servico de 8 horas\",\"categoria\":\"Ajustes\",\"precoReferencia\":100,\"tempoEstimadoDias\":1,\"ativo\":true}").get("id").asText();
    }

    @AfterEach
    void limparConfiguracao() throws Exception {
        limparFolgas();
    }

    @Test
    void deveSomarFilaEDarPrioridadeAoPedidoUrgente() throws Exception {
        String hoje = LocalDate.now().toString();
        String amanha = LocalDate.now().plusDays(1).toString();
        String depois = LocalDate.now().plusDays(2).toString();

        String primeira = criarOrdem(false).get("id").asText();
        String segunda = criarOrdem(false).get("id").asText();
        mvc.perform(get("/api/ordens-servico/{id}", segunda))
                .andExpect(jsonPath("$.dataPrevistaEntrega").value(amanha));

        MvcResult urgenteResult = mvc.perform(post("/api/ordens-servico").contentType(MediaType.APPLICATION_JSON)
                        .content(ordemJson(true, null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.dataPrevistaEntrega").value(hoje))
                .andExpect(jsonPath("$.impactosPrazo.length()").value(2))
                .andReturn();
        JsonNode urgente = mapper.readTree(urgenteResult.getResponse().getContentAsString());
        mvc.perform(get("/api/ordens-servico/{id}", primeira))
                .andExpect(jsonPath("$.dataPrevistaEntrega").value(amanha));
        mvc.perform(get("/api/ordens-servico/{id}", segunda))
                .andExpect(jsonPath("$.dataPrevistaEntrega").value(depois));

        mvc.perform(post("/api/ordens-servico/previsao").contentType(MediaType.APPLICATION_JSON)
                        .content(ordemJson(false, null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.horasFila").value(24))
                .andExpect(jsonPath("$.horasServico").value(8))
                .andExpect(jsonPath("$.diasUteis").value(4));
        mvc.perform(get("/api/ordens-servico/{id}", urgente.get("id").asText()))
                .andExpect(jsonPath("$.urgente").value(true));
    }

    @Test
    void devePularFolgaEImpedirProvaNesseDia() throws Exception {
        String hoje = LocalDate.now().toString();
        String amanha = LocalDate.now().plusDays(1).toString();
        String depois = LocalDate.now().plusDays(2).toString();
        mvc.perform(put("/api/configuracoes").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"folgas\":[\"" + amanha + "\"]}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.folgas[0]").value(amanha));

        mvc.perform(post("/api/ordens-servico/previsao").contentType(MediaType.APPLICATION_JSON)
                        .content(ordemJson(false, null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dataPrevistaEntrega").value(hoje));

        // Com um serviço de dois dias, a entrega passa pela folga e cai no dia seguinte.
        mvc.perform(put("/api/servicos/{id}", servicoId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Servico de 16 horas\",\"categoria\":\"Ajustes\",\"precoReferencia\":100,\"tempoEstimadoDias\":2,\"ativo\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tempoEstimadoHoras").value(16));
        mvc.perform(post("/api/ordens-servico/previsao").contentType(MediaType.APPLICATION_JSON)
                        .content(ordemJson(false, null)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dataPrevistaEntrega").value(depois));
        mvc.perform(post("/api/ordens-servico").contentType(MediaType.APPLICATION_JSON)
                        .content(ordemJson(false, amanha)))
                .andExpect(status().isUnprocessableEntity());
    }

    private JsonNode criarOrdem(boolean urgente) throws Exception {
        return criar("/api/ordens-servico", ordemJson(urgente, null));
    }

    private String ordemJson(boolean urgente, String prova) {
        String provaJson = prova == null ? "null" : "\"" + prova + "\"";
        return "{\"clienteId\":\"" + clienteId + "\",\"servicoId\":\"" + servicoId + "\","
                + "\"responsavelId\":\"\",\"tipoPeca\":\"Vestido\",\"descricaoPeca\":\"Peca para calculo de prazo\","
                + "\"valorServico\":100,\"desconto\":0,\"urgente\":" + urgente + ",\"dataEntrada\":\"" + LocalDate.now() + "\","
                + "\"dataProva\":" + provaJson + ",\"status\":\"aguardando\"}";
    }

    private JsonNode criar(String caminho, String json) throws Exception {
        MvcResult result = mvc.perform(post(caminho).contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated()).andReturn();
        return mapper.readTree(result.getResponse().getContentAsString());
    }

    private void limparFolgas() throws Exception {
        mvc.perform(put("/api/configuracoes").contentType(MediaType.APPLICATION_JSON).content("{\"folgas\":[]}"));
    }
}
