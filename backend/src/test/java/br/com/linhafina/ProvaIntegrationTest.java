package br.com.linhafina;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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
class ProvaIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired ClienteRepository clientes;
    @Autowired FuncionariaRepository funcionarias;
    @Autowired ServicoRepository servicos;
    @Autowired OrcamentoRepository orcamentos;
    @Autowired OrdemServicoRepository ordens;
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
        clienteId = criar("/api/clientes", "{\"nome\":\"Cliente Prova\",\"telefone\":\"11999999999\",\"email\":\"prova@teste.com\"}").get("id").asText();
        servicoId = criar("/api/servicos", "{\"nome\":\"Confeccao Prova\",\"categoria\":\"Confecção sob medida\",\"precoReferencia\":100,\"tempoEstimadoDias\":2,\"ativo\":true}").get("id").asText();
    }

    @Test
    void deveExigirDataRemarcarFaltaEConfirmarComparecimento() throws Exception {
        String osId = criar("/api/ordens-servico", ordemJson(true)).get("id").asText();
        mvc.perform(post("/api/ordens-servico/{id}/avancar-status", osId)).andExpect(status().isOk());
        mvc.perform(post("/api/ordens-servico/{id}/avancar-status", osId)).andExpect(status().isOk());
        mvc.perform(post("/api/ordens-servico/{id}/avancar-status", osId)).andExpect(status().isUnprocessableEntity());

        String novaData = LocalDate.now().plusDays(4).toString();
        MvcResult antes = mvc.perform(post("/api/ordens-servico/{id}/prova", osId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"compareceu\":false,\"novaDataProva\":\"" + novaData + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.dataProva").value(novaData))
                .andExpect(jsonPath("$.provaComparecida").value(false))
                .andReturn();
        String novaPrevisao = mapper.readTree(antes.getResponse().getContentAsString()).get("dataPrevistaEntrega").asText();
        org.assertj.core.api.Assertions.assertThat(LocalDate.parse(novaPrevisao)).isAfter(LocalDate.parse(novaData));

        mvc.perform(post("/api/ordens-servico/{id}/prova", osId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"compareceu\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("pronta"))
                .andExpect(jsonPath("$.provaComparecida").value(true))
                .andExpect(jsonPath("$.dataPronta").isNotEmpty());
    }

    @Test
    void confeccaoSobMedidaPrecisaDeDataDeProva() throws Exception {
        mvc.perform(post("/api/ordens-servico").contentType(MediaType.APPLICATION_JSON).content(ordemJson(false)))
                .andExpect(status().isUnprocessableEntity());
    }

    private String ordemJson(boolean comProva) {
        return "{\"clienteId\":\"" + clienteId + "\",\"servicoId\":\"" + servicoId + "\",\"responsavelId\":\"\","
                + "\"tipoPeca\":\"Vestido\",\"descricaoPeca\":\"Confeccao sob medida de teste\",\"sobMedida\":true,\"valorServico\":100,\"desconto\":0,"
                + "\"urgente\":false,\"dataEntrada\":\"" + LocalDate.now() + "\",\"dataProva\":" + (comProva ? "\"" + LocalDate.now().plusDays(1) + "\"" : "null") + ",\"status\":\"aguardando\"}";
    }

    private JsonNode criar(String caminho, String json) throws Exception {
        MvcResult result = mvc.perform(post(caminho).contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated()).andReturn();
        return mapper.readTree(result.getResponse().getContentAsString());
    }
}
