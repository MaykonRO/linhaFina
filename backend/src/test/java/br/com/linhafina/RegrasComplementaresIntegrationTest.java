package br.com.linhafina;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.linhafina.model.OrdemServico;
import br.com.linhafina.repository.ClienteRepository;
import br.com.linhafina.repository.FuncionariaRepository;
import br.com.linhafina.repository.OrcamentoRepository;
import br.com.linhafina.repository.OrdemServicoRepository;
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

@SpringBootTest(properties = {"atelie.bloqueio-pendencias=true", "atelie.taxa-guarda-dia=5", "atelie.dias-tolerancia-retirada=2"})
@AutoConfigureMockMvc
@WithMockUser(username = "admin@teste.local", roles = "DONO")
class RegrasComplementaresIntegrationTest {

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
        desativarFidelidade();
        clienteId = criar("/api/clientes", "{\"nome\":\"Cliente Regras\",\"telefone\":\"11999999999\",\"email\":\"regras@teste.com\"}").get("id").asText();
        servicoId = criar("/api/servicos", "{\"nome\":\"Servico Regras\",\"categoria\":\"Ajustes\",\"precoReferencia\":100,\"tempoEstimadoDias\":1,\"ativo\":true}").get("id").asText();
    }

    @AfterEach
    void restaurar() throws Exception {
        desativarFidelidade();
    }

    @Test
    void deveBloquearNovaOsComPecaPronta() throws Exception {
        String id = criarOrdem().get("id").asText();
        avancar(id, 3);
        mvc.perform(post("/api/ordens-servico").contentType(MediaType.APPLICATION_JSON).content(ordemJson()))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void deveBloquearNovaOsComPagamentoPendente() throws Exception {
        String id = criarOrdem().get("id").asText();
        avancar(id, 4);
        mvc.perform(post("/api/ordens-servico").contentType(MediaType.APPLICATION_JSON).content(ordemJson()))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    void deveCalcularTaxaDeGuardaDepoisDaTolerancia() throws Exception {
        String id = criarOrdem().get("id").asText();
        avancar(id, 3);
        OrdemServico os = ordens.findById(Long.valueOf(id)).orElseThrow();
        os.setDataPronta(LocalDate.now().minusDays(5));
        ordens.save(os);
        mvc.perform(post("/api/ordens-servico/{id}/avancar-status", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.taxaGuarda").value(15.0))
                .andExpect(jsonPath("$.valorFinal").value(115.0));
    }

    @Test
    void deveAplicarFidelidadeQuandoRegraForAtingida() throws Exception {
        mvc.perform(put("/api/configuracoes").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"fidelidade\":{\"ativo\":true,\"descontoPercentual\":10,\"servicosNecessarios\":1,\"regra\":\"Teste de fidelidade\"}}"))
                .andExpect(status().isOk());
        String entregue = criarOrdem().get("id").asText();
        avancar(entregue, 4);
        mvc.perform(post("/api/ordens-servico/{id}/pagamento", entregue).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"pago\",\"valorPago\":100}"))
                .andExpect(status().isOk());
        mvc.perform(post("/api/ordens-servico").contentType(MediaType.APPLICATION_JSON).content(ordemJson()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.desconto").value(10.0))
                .andExpect(jsonPath("$.valorFinal").value(90.0));
    }

    private JsonNode criarOrdem() throws Exception {
        return criar("/api/ordens-servico", ordemJson());
    }

    private String ordemJson() {
        return "{\"clienteId\":\"" + clienteId + "\",\"servicoId\":\"" + servicoId + "\",\"responsavelId\":\"\","
                + "\"tipoPeca\":\"Vestido\",\"descricaoPeca\":\"Peca para regra complementar\",\"valorServico\":100,\"desconto\":0,"
                + "\"urgente\":false,\"dataEntrada\":\"" + LocalDate.now() + "\",\"status\":\"aguardando\"}";
    }

    private void avancar(String id, int vezes) throws Exception {
        for (int i = 0; i < vezes; i++) {
            mvc.perform(post("/api/ordens-servico/{id}/avancar-status", id)).andExpect(status().isOk());
        }
    }

    private JsonNode criar(String caminho, String json) throws Exception {
        MvcResult result = mvc.perform(post(caminho).contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated()).andReturn();
        return mapper.readTree(result.getResponse().getContentAsString());
    }

    private void desativarFidelidade() throws Exception {
        mvc.perform(put("/api/configuracoes").contentType(MediaType.APPLICATION_JSON)
                .content("{\"fidelidade\":{\"ativo\":false}}"));
    }
}
