package br.com.linhafina;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.linhafina.model.Pagamento;
import br.com.linhafina.model.Pessoa;
import br.com.linhafina.repository.ClienteRepository;
import br.com.linhafina.repository.FuncionariaRepository;
import br.com.linhafina.repository.OrdemServicoRepository;
import br.com.linhafina.repository.OrcamentoRepository;
import br.com.linhafina.repository.PagamentoRepository;
import br.com.linhafina.repository.PessoaRepository;
import br.com.linhafina.repository.ServicoRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
@WithMockUser(username = "admin@teste.local", roles = "DONO")
class NucleoIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired JdbcTemplate jdbc;
    @Autowired ClienteRepository clientes;
    @Autowired FuncionariaRepository funcionarias;
    @Autowired ServicoRepository servicos;
    @Autowired OrdemServicoRepository ordens;
    @Autowired OrcamentoRepository orcamentos;
    @Autowired PagamentoRepository pagamentos;
    @Autowired PessoaRepository pessoas;

    @BeforeEach
    void limparBancoDeTeste() {
        pagamentos.deleteAll();
        orcamentos.deleteAll();
        ordens.deleteAll();
        clientes.deleteAll();
        funcionarias.deleteAll();
        servicos.deleteAll();
    }

    @Test
    void clienteDeveExecutarCrudRealComTelefoneNormalizadoEMedidas() throws Exception {
        JsonNode cliente = criarCliente("Maria Teste", "(11) 98765-4321", "");
        String id = cliente.get("id").asText();
        assertThat(cliente.get("telefone").asText()).isEqualTo("11987654321");
        assertThat(cliente.get("tipo").asText()).isEqualTo("Cliente");

        mvc.perform(put("/api/clientes/{id}", id).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"medidas\":{\"busto\":90.5,\"observacoes\":\"Medida de teste\"}}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Maria Teste"))
                .andExpect(jsonPath("$.medidas.busto").value(90.5));

        mvc.perform(get("/api/clientes/{id}", id)).andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id));
        mvc.perform(delete("/api/clientes/{id}", id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/clientes/{id}", id)).andExpect(status().isNotFound());
    }

    @Test
    void servicoDeveValidarCriarAlterarSituacaoEExcluir() throws Exception {
        mvc.perform(post("/api/servicos").contentType(MediaType.APPLICATION_JSON)
                        .content(servicoJson(0)))
                .andExpect(status().isBadRequest());

        JsonNode servico = criarServico();
        String id = servico.get("id").asText();
        mvc.perform(patch("/api/servicos/{id}/situacao", id).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"ativo\":false}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.ativo").value(false));
        mvc.perform(delete("/api/servicos/{id}", id)).andExpect(status().isNoContent());
        assertThat(servicos.count()).isZero();
    }

    @Test
    void herancaDevePersistirNasTabelasEUsarPolimorfismo() throws Exception {
        criarCliente("Cliente Heranca", "11999999999", "cliente@teste.com");
        criarFuncionaria("Costureira Heranca");

        List<Pessoa> lista = pessoas.findAll();
        assertThat(lista).hasSize(2);
        assertThat(lista).extracting(Pessoa::getTipoPessoa)
                .containsExactlyInAnyOrder("Cliente", "Funcionaria");
        Integer registrosPessoas = jdbc.queryForObject("SELECT COUNT(*) FROM pessoas", Integer.class);
        Integer registrosClientes = jdbc.queryForObject("SELECT COUNT(*) FROM clientes", Integer.class);
        Integer registrosFuncionarias = jdbc.queryForObject("SELECT COUNT(*) FROM funcionarias", Integer.class);
        assertThat(registrosPessoas).isEqualTo(2);
        assertThat(registrosClientes).isEqualTo(1);
        assertThat(registrosFuncionarias).isEqualTo(1);
    }

    @Test
    void ordemDevePersistirRelacionamentosCalcularUrgenciaEPercorrerFluxo() throws Exception {
        String clienteId = criarCliente("Cliente OS", "11988887777", "os@teste.com").get("id").asText();
        String servicoId = criarServico().get("id").asText();
        String funcionariaId = criarFuncionaria("Costureira OS").get("id").asText();

        JsonNode os = criarOrdem(clienteId, servicoId, funcionariaId, true);
        String id = os.get("id").asText();
        assertThat(os.get("codigo").asText()).startsWith("OS-");
        assertThat(os.get("taxaUrgencia").decimalValue()).isEqualByComparingTo("20.00");
        assertThat(os.get("valorFinal").decimalValue()).isEqualByComparingTo("120.00");
        assertThat(os.get("clienteId").asText()).isEqualTo(clienteId);
        assertThat(os.get("servicoId").asText()).isEqualTo(servicoId);
        assertThat(os.get("responsavelId").asText()).isEqualTo(funcionariaId);

        mvc.perform(post("/api/ordens-servico/{id}/avancar-status", id))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("producao"));
        mvc.perform(post("/api/ordens-servico/{id}/avancar-status", id))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("prova"));
        mvc.perform(post("/api/ordens-servico/{id}/avancar-status", id))
                .andExpect(status().isOk()).andExpect(jsonPath("$.status").value("pronta"));
        mvc.perform(post("/api/ordens-servico/{id}/avancar-status", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("entregue"))
                .andExpect(jsonPath("$.dataEntrega").isNotEmpty());

        mvc.perform(post("/api/ordens-servico/{id}/pagamento", id).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"pago\",\"valorPago\":120}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.valorPago").value(120.0))
                .andExpect(jsonPath("$.pagamentoStatus").value("pago"));
        List<Pagamento> baixas = pagamentos.findByOrdemServicoIdOrderByDataPagamentoDesc(Long.valueOf(id));
        assertThat(baixas).hasSize(1);
        assertThat(baixas.getFirst().getValor()).isEqualByComparingTo(new BigDecimal("120.00"));

        mvc.perform(delete("/api/clientes/{id}", clienteId)).andExpect(status().isUnprocessableEntity());
        mvc.perform(delete("/api/servicos/{id}", servicoId)).andExpect(status().isUnprocessableEntity());
        mvc.perform(delete("/api/funcionarias/{id}", funcionariaId)).andExpect(status().isUnprocessableEntity());
    }

    @Test
    void cancelamentoDeveExigirMotivoEAtualizacaoNaoPodeApagarFinanceiro() throws Exception {
        String clienteId = criarCliente("Cliente Cancelamento", "11977776666", "c@teste.com").get("id").asText();
        String servicoId = criarServico().get("id").asText();
        String id = criarOrdem(clienteId, servicoId, "", false).get("id").asText();

        mvc.perform(post("/api/ordens-servico/{id}/cancelar", id).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"motivo\":\"\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/ordens-servico/{id}/cancelar", id).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"motivo\":\"Cliente desistiu do teste\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("cancelada"))
                .andExpect(jsonPath("$.motivoCancelamento").value("Cliente desistiu do teste"));
        mvc.perform(post("/api/ordens-servico/{id}/avancar-status", id))
                .andExpect(status().isUnprocessableEntity());
    }

    private JsonNode criarCliente(String nome, String telefone, String email) throws Exception {
        String json = "{\"nome\":\"" + nome + "\",\"telefone\":\"" + telefone + "\",\"email\":\"" + email + "\",\"cidade\":\"Sao Paulo\"}";
        MvcResult result = mvc.perform(post("/api/clientes").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated()).andReturn();
        return mapper.readTree(result.getResponse().getContentAsString());
    }

    private JsonNode criarServico() throws Exception {
        MvcResult result = mvc.perform(post("/api/servicos").contentType(MediaType.APPLICATION_JSON).content(servicoJson(3)))
                .andExpect(status().isCreated()).andReturn();
        return mapper.readTree(result.getResponse().getContentAsString());
    }

    private String servicoJson(int dias) {
        return "{\"nome\":\"Ajuste de teste\",\"categoria\":\"Ajustes\",\"descricao\":\"Servico para teste\",\"precoReferencia\":100,\"tempoEstimadoDias\":" + dias + ",\"ativo\":true}";
    }

    private JsonNode criarFuncionaria(String nome) throws Exception {
        String json = "{\"nome\":\"" + nome + "\",\"cargo\":\"Costureira\",\"papel\":\"funcionario\",\"status\":\"disponivel\",\"especialidade\":\"Ajustes\"}";
        MvcResult result = mvc.perform(post("/api/funcionarias").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated()).andReturn();
        return mapper.readTree(result.getResponse().getContentAsString());
    }

    private JsonNode criarOrdem(String clienteId, String servicoId, String funcionariaId, boolean urgente) throws Exception {
        String hoje = LocalDate.now().toString();
        String previsao = LocalDate.now().plusDays(5).toString();
        String json = "{\"clienteId\":\"" + clienteId + "\",\"servicoId\":\"" + servicoId + "\","
                + "\"responsavelId\":\"" + funcionariaId + "\",\"tipoPeca\":\"Vestido\",\"descricaoPeca\":\"Vestido de teste\","
                + "\"sobMedida\":false,\"ajuste\":true,\"urgente\":" + urgente + ",\"valorServico\":100,\"desconto\":0,"
                + "\"dataEntrada\":\"" + hoje + "\",\"dataPrevistaEntrega\":\"" + previsao + "\",\"status\":\"aguardando\"}";
        MvcResult result = mvc.perform(post("/api/ordens-servico").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated()).andReturn();
        return mapper.readTree(result.getResponse().getContentAsString());
    }
}
