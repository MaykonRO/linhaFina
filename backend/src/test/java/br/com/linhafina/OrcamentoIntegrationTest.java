package br.com.linhafina;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
class OrcamentoIntegrationTest {

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
        clienteId = criar("/api/clientes", "{\"nome\":\"Cliente Orcamento\",\"telefone\":\"11999999999\",\"email\":\"orc@teste.com\"}", 201).get("id").asText();
        servicoId = criar("/api/servicos", "{\"nome\":\"Servico Orcamento\",\"categoria\":\"Ajustes\",\"precoReferencia\":100,\"tempoEstimadoDias\":2,\"ativo\":true}", 201).get("id").asText();
    }

    @Test
    void deveAprovarEConverterUmaUnicaVezEmOsReal() throws Exception {
        String id = criarOrcamento(LocalDate.now().plusDays(10), true).get("id").asText();
        mvc.perform(put("/api/orcamentos/{id}", id).contentType(MediaType.APPLICATION_JSON).content(orcamentoJson(LocalDate.now().plusDays(10), true, 150)))
                .andExpect(status().isOk()).andExpect(jsonPath("$.valorEstimado").value(150));
        mvc.perform(post("/api/orcamentos/{id}/aprovar", id))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("aprovado"));

        MvcResult conversao = mvc.perform(post("/api/orcamentos/{id}/converter", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigo").isNotEmpty())
                .andExpect(jsonPath("$.valorFinal").value(150))
                .andReturn();
        String osId = mapper.readTree(conversao.getResponse().getContentAsString()).get("id").asText();
        mvc.perform(get("/api/orcamentos/{id}", id))
                .andExpect(jsonPath("$.status").value("convertido"))
                .andExpect(jsonPath("$.convertidoOsId").value(osId));
        mvc.perform(get("/api/ordens-servico/{id}", osId))
                .andExpect(jsonPath("$.clienteId").value(clienteId))
                .andExpect(jsonPath("$.servicoId").value(servicoId));
        mvc.perform(post("/api/orcamentos/{id}/converter", id)).andExpect(status().isUnprocessableEntity());
        mvc.perform(delete("/api/clientes/{id}", clienteId)).andExpect(status().isUnprocessableEntity());
        mvc.perform(delete("/api/servicos/{id}", servicoId)).andExpect(status().isUnprocessableEntity());
    }

    @Test
    void deveRecusarEExpirarOrcamento() throws Exception {
        String recusado = criarOrcamento(LocalDate.now().plusDays(5), true).get("id").asText();
        mvc.perform(post("/api/orcamentos/{id}/recusar", recusado).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"motivo\":\"Cliente nao aprovou o valor\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("recusado"))
                .andExpect(jsonPath("$.motivo").value("Cliente nao aprovou o valor"));

        String vencido = criarOrcamento(LocalDate.now().minusDays(1), true).get("id").asText();
        mvc.perform(get("/api/orcamentos"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/orcamentos/{id}", vencido))
                .andExpect(jsonPath("$.status").value("expirado"));
        mvc.perform(post("/api/orcamentos/{id}/aprovar", vencido)).andExpect(status().isUnprocessableEntity());
    }

    @Test
    void naoDeveConverterSemServico() throws Exception {
        String id = criarOrcamento(LocalDate.now().plusDays(5), false).get("id").asText();
        mvc.perform(post("/api/orcamentos/{id}/aprovar", id)).andExpect(status().isOk());
        mvc.perform(post("/api/orcamentos/{id}/converter", id)).andExpect(status().isUnprocessableEntity());
        org.assertj.core.api.Assertions.assertThat(ordens.count()).isZero();
    }

    private JsonNode criarOrcamento(LocalDate validade, boolean comServico) throws Exception {
        return criar("/api/orcamentos", orcamentoJson(validade, comServico, 100), 201);
    }

    private String orcamentoJson(LocalDate validade, boolean comServico, double valor) {
        String inicio = validade.minusDays(5).toString();
        return "{\"clienteId\":\"" + clienteId + "\",\"servicoId\":\"" + (comServico ? servicoId : "") + "\","
                + "\"descricao\":\"Descricao real do teste de orcamento\",\"valorEstimado\":" + valor + ","
                + "\"dataCriacao\":\"" + inicio + "\",\"validade\":\"" + validade + "\"}";
    }

    private JsonNode criar(String caminho, String json, int statusEsperado) throws Exception {
        MvcResult result = mvc.perform(post(caminho).contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().is(statusEsperado)).andReturn();
        return mapper.readTree(result.getResponse().getContentAsString());
    }
}
