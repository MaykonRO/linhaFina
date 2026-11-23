package br.com.linhafina;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
class PagamentoIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired ClienteRepository clientes;
    @Autowired FuncionariaRepository funcionarias;
    @Autowired ServicoRepository servicos;
    @Autowired OrcamentoRepository orcamentos;
    @Autowired OrdemServicoRepository ordens;
    @Autowired PagamentoRepository pagamentos;

    @BeforeEach
    void limpar() {
        pagamentos.deleteAll();
        orcamentos.deleteAll();
        ordens.deleteAll();
        clientes.deleteAll();
        funcionarias.deleteAll();
        servicos.deleteAll();
    }

    @Test
    void deveRegistrarBaixasPelaRotaDePagamentosEListarHistorico() throws Exception {
        String clienteId = criar("/api/clientes", "{\"nome\":\"Cliente Pagamento\",\"telefone\":\"11999999999\",\"email\":\"pag@teste.com\"}").get("id").asText();
        String servicoId = criar("/api/servicos", "{\"nome\":\"Servico Pagamento\",\"categoria\":\"Ajustes\",\"precoReferencia\":100,\"tempoEstimadoDias\":1,\"ativo\":true}").get("id").asText();
        String json = "{\"clienteId\":\"" + clienteId + "\",\"servicoId\":\"" + servicoId + "\",\"responsavelId\":\"\","
                + "\"tipoPeca\":\"Vestido\",\"descricaoPeca\":\"Peca para pagamento\",\"valorServico\":100,\"desconto\":0,"
                + "\"urgente\":false,\"dataEntrada\":\"" + LocalDate.now() + "\",\"status\":\"aguardando\"}";
        String osId = criar("/api/ordens-servico", json).get("id").asText();

        mvc.perform(post("/api/pagamentos/{id}", osId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"parcial\",\"valorPago\":50}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valorPago").value(50))
                .andExpect(jsonPath("$.pagamentoStatus").value("parcial"));
        mvc.perform(get("/api/pagamentos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].valor").value(50))
                .andExpect(jsonPath("$[0].ordemServicoId").value(osId));

        mvc.perform(post("/api/pagamentos/{id}", osId).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"pago\",\"valorPago\":50}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valorPago").value(100))
                .andExpect(jsonPath("$.pagamentoStatus").value("pago"));
        mvc.perform(get("/api/pagamentos")).andExpect(jsonPath("$.length()").value(2));
    }

    private JsonNode criar(String caminho, String json) throws Exception {
        MvcResult result = mvc.perform(post(caminho).contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated()).andReturn();
        return mapper.readTree(result.getResponse().getContentAsString());
    }
}
