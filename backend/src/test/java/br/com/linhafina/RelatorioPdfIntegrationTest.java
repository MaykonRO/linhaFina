package br.com.linhafina;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.linhafina.repository.ClienteRepository;
import br.com.linhafina.repository.FuncionariaRepository;
import br.com.linhafina.repository.OrcamentoRepository;
import br.com.linhafina.repository.OrdemServicoRepository;
import br.com.linhafina.repository.PagamentoRepository;
import br.com.linhafina.repository.ServicoRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
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
class RelatorioPdfIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired ClienteRepository clientes;
    @Autowired FuncionariaRepository funcionarias;
    @Autowired ServicoRepository servicos;
    @Autowired OrcamentoRepository orcamentos;
    @Autowired OrdemServicoRepository ordens;
    @Autowired PagamentoRepository pagamentos;

    private String osId;

    @BeforeEach
    void preparar() throws Exception {
        pagamentos.deleteAll();
        orcamentos.deleteAll();
        ordens.deleteAll();
        clientes.deleteAll();
        funcionarias.deleteAll();
        servicos.deleteAll();
        String clienteId = criar("/api/clientes", "{\"nome\":\"Cliente Relatorio\",\"telefone\":\"11999999999\",\"email\":\"rel@teste.com\"}").get("id").asText();
        String servicoId = criar("/api/servicos", "{\"nome\":\"Servico Relatorio\",\"categoria\":\"Ajustes\",\"precoReferencia\":100,\"tempoEstimadoDias\":1,\"ativo\":true}").get("id").asText();
        String funcionariaId = criar("/api/funcionarias", "{\"nome\":\"Costureira Relatorio\",\"cargo\":\"Costureira\",\"papel\":\"funcionario\",\"status\":\"disponivel\"}").get("id").asText();
        String json = "{\"clienteId\":\"" + clienteId + "\",\"servicoId\":\"" + servicoId + "\",\"responsavelId\":\"" + funcionariaId + "\","
                + "\"tipoPeca\":\"Vestido\",\"descricaoPeca\":\"Peca para relatorio e PDF\",\"valorServico\":100,\"desconto\":0,"
                + "\"urgente\":false,\"dataEntrada\":\"" + LocalDate.now() + "\",\"status\":\"aguardando\"}";
        osId = criar("/api/ordens-servico", json).get("id").asText();
        for (int i = 0; i < 4; i++) mvc.perform(post("/api/ordens-servico/{id}/avancar-status", osId)).andExpect(status().isOk());
        mvc.perform(post("/api/ordens-servico/{id}/pagamento", osId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"pago\",\"valorPago\":100}"))
                .andExpect(status().isOk());
    }

    @Test
    void deveGerarResumoRankingEntregasEProdutividade() throws Exception {
        mvc.perform(get("/api/relatorios/resumo"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.faturamento").value(100))
                .andExpect(jsonPath("$.recebido").value(100))
                .andExpect(jsonPath("$.aReceber").value(0))
                .andExpect(jsonPath("$.totalOrdens").value(1))
                .andExpect(jsonPath("$.ticketMedio").value(100.0))
                .andExpect(jsonPath("$.rankingServicos[0].quantidade").value(1));
        mvc.perform(get("/api/relatorios/entregas"))
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.noPrazo").value(1));
        mvc.perform(get("/api/relatorios/produtividade"))
                .andExpect(jsonPath("$[0].entregues").value(1))
                .andExpect(jsonPath("$[0].osAtivas").value(0));
    }

    @Test
    void deveExportarPdfRealDaOs() throws Exception {
        MvcResult resultado = mvc.perform(get("/api/ordens-servico/{id}/pdf", osId))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andReturn();
        byte[] pdf = resultado.getResponse().getContentAsByteArray();
        assertThat(pdf.length).isGreaterThan(500);
        assertThat(new String(pdf, 0, 4)).isEqualTo("%PDF");
    }

    private JsonNode criar(String caminho, String json) throws Exception {
        MvcResult result = mvc.perform(post(caminho).contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated()).andReturn();
        return mapper.readTree(result.getResponse().getContentAsString());
    }
}
