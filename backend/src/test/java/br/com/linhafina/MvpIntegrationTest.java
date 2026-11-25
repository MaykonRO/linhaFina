package br.com.linhafina;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.linhafina.model.Papel;
import br.com.linhafina.model.Usuario;
import br.com.linhafina.repository.ClienteRepository;
import br.com.linhafina.repository.OrdemServicoRepository;
import br.com.linhafina.repository.UsuarioRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class MvpIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired UsuarioRepository usuarios;
    @Autowired ClienteRepository clientes;
    @Autowired OrdemServicoRepository ordens;
    @Autowired PasswordEncoder encoder;

    @BeforeEach
    void prepararBanco() {
        ordens.deleteAll();
        clientes.deleteAll();
        usuarios.deleteAll();
        usuarios.save(new Usuario(
                "Admin Teste", "admin@teste.local", encoder.encode("senha-teste"), Papel.DONO));
    }

    @Test
    void deveEntrarRestaurarSessaoESair() throws Exception {
        mvc.perform(get("/api/saude")).andExpect(status().isOk());
        mvc.perform(get("/api/clientes")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/autenticacao/entrar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@teste.local\",\"senha\":\"senha-errada\"}"))
                .andExpect(status().isUnauthorized());

        MvcResult resultado = mvc.perform(post("/api/autenticacao/entrar")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@teste.local\",\"senha\":\"senha-teste\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Admin Teste"))
                .andExpect(jsonPath("$.papel").value("dono"))
                .andExpect(jsonPath("$.senhaHash").doesNotExist())
                .andReturn();
        MockHttpSession sessao = (MockHttpSession) resultado.getRequest().getSession(false);

        mvc.perform(get("/api/autenticacao/sessao").session(sessao))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("admin@teste.local"));
        mvc.perform(get("/api/clientes").session(sessao)).andExpect(status().isOk());
        mvc.perform(post("/api/autenticacao/sair").session(sessao))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/autenticacao/sessao")).andExpect(status().isUnauthorized());
    }

    @Test
    @WithMockUser(username = "admin@teste.local", roles = "DONO")
    void deveExecutarCrudDeCliente() throws Exception {
        JsonNode cliente = criarCliente("Maria Teste");
        String id = cliente.get("id").asText();

        assertThat(cliente.get("id").isTextual()).isTrue();
        assertThat(cliente.get("telefone").asText()).isEqualTo("11987654321");
        LocalDateTime.parse(cliente.get("criadoEm").asText());

        mvc.perform(get("/api/clientes"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id));
        mvc.perform(get("/api/clientes/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Maria Teste"));

        Map<String, Object> alteracao = new LinkedHashMap<>();
        alteracao.put("nome", "Maria Atualizada");
        alteracao.put("telefone", "(11) 91234-5678");
        alteracao.put("email", "maria.nova@teste.com");
        mvc.perform(put("/api/clientes/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(alteracao)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nome").value("Maria Atualizada"))
                .andExpect(jsonPath("$.telefone").value("11912345678"))
                .andExpect(jsonPath("$.email").value("maria.nova@teste.com"));

        mvc.perform(delete("/api/clientes/{id}", id)).andExpect(status().isNoContent());
        mvc.perform(get("/api/clientes/{id}", id)).andExpect(status().isNotFound());
        assertThat(clientes.existsById(Long.valueOf(id))).isFalse();
    }

    @Test
    @WithMockUser(username = "admin@teste.local", roles = "DONO")
    void deveBloquearDeleteDeClienteComOrdemVinculada() throws Exception {
        String clienteId = criarCliente("Cliente Vinculada").get("id").asText();
        String ordemId = criarOrdem(clienteId).get("id").asText();

        mvc.perform(delete("/api/clientes/{id}", clienteId))
                .andExpect(status().isUnprocessableEntity());
        assertThat(clientes.existsById(Long.valueOf(clienteId))).isTrue();

        mvc.perform(delete("/api/ordens-servico/{id}", ordemId))
                .andExpect(status().isNoContent());
        mvc.perform(delete("/api/clientes/{id}", clienteId))
                .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(username = "admin@teste.local", roles = "DONO")
    void deveExecutarCrudDeOrdemServico() throws Exception {
        String clienteId = criarCliente("Cliente OS").get("id").asText();
        JsonNode ordem = criarOrdem(clienteId);
        String id = ordem.get("id").asText();

        assertThat(ordem.get("id").isTextual()).isTrue();
        assertThat(ordem.get("clienteId").isTextual()).isTrue();
        assertThat(ordem.get("codigo").asText()).matches("OS-\\d{6}");
        assertThat(ordem.get("status").asText()).isEqualTo("pendente");
        assertThat(ordem.get("dataEntrada").asText()).isEqualTo("2026-01-10");
        assertThat(ordem.get("dataPrevistaEntrega").asText()).isEqualTo("2026-01-15");
        LocalDateTime.parse(ordem.get("criadoEm").asText());

        mvc.perform(get("/api/ordens-servico"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value(id));
        mvc.perform(get("/api/ordens-servico/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.descricaoServico").value("Ajuste de vestido"));

        Map<String, Object> alteracao = dadosOrdem(clienteId);
        alteracao.put("descricaoServico", "Confeccao de saia");
        alteracao.put("valor", new BigDecimal("175.50"));
        alteracao.put("status", "concluida");
        mvc.perform(put("/api/ordens-servico/{id}", id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(alteracao)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.descricaoServico").value("Confeccao de saia"))
                .andExpect(jsonPath("$.valor").value(175.50))
                .andExpect(jsonPath("$.status").value("concluida"));

        mvc.perform(delete("/api/ordens-servico/{id}", id))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/ordens-servico/{id}", id)).andExpect(status().isNotFound());
        assertThat(ordens.existsById(Long.valueOf(id))).isFalse();
    }

    @Test
    @WithMockUser(username = "admin@teste.local", roles = "DONO")
    void deveValidarDadosDeCliente() throws Exception {
        mvc.perform(post("/api/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\" \",\"telefone\":\"11999999999\",\"email\":\"cliente@teste.com\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Cliente\",\"telefone\":\"\",\"email\":\"cliente@teste.com\"}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Cliente\",\"telefone\":\"123\",\"email\":\"cliente@teste.com\"}"))
                .andExpect(status().isUnprocessableEntity());
        mvc.perform(post("/api/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"nome\":\"Cliente\",\"telefone\":\"11999999999\",\"email\":\"email-invalido\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(username = "admin@teste.local", roles = "DONO")
    void deveValidarDadosDeOrdemServico() throws Exception {
        String clienteId = criarCliente("Cliente Validacao").get("id").asText();

        Map<String, Object> dados = dadosOrdem(clienteId);
        dados.put("valor", BigDecimal.ZERO);
        mvc.perform(post("/api/ordens-servico")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(dados)))
                .andExpect(status().isBadRequest());

        dados = dadosOrdem(clienteId);
        dados.put("dataEntrada", "2026-01-20");
        dados.put("dataPrevistaEntrega", "2026-01-19");
        mvc.perform(post("/api/ordens-servico")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(dados)))
                .andExpect(status().isUnprocessableEntity());

        dados = dadosOrdem("999999");
        mvc.perform(post("/api/ordens-servico")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(dados)))
                .andExpect(status().isNotFound());

        dados = dadosOrdem(clienteId);
        dados.put("status", "inexistente");
        mvc.perform(post("/api/ordens-servico")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(dados)))
                .andExpect(status().isUnprocessableEntity());
    }

    private JsonNode criarCliente(String nome) throws Exception {
        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("nome", nome);
        dados.put("telefone", "(11) 98765-4321");
        dados.put("email", "cliente@teste.com");
        MvcResult resultado = mvc.perform(post("/api/clientes")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(dados)))
                .andExpect(status().isCreated())
                .andReturn();
        return mapper.readTree(resultado.getResponse().getContentAsString());
    }

    private JsonNode criarOrdem(String clienteId) throws Exception {
        MvcResult resultado = mvc.perform(post("/api/ordens-servico")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(dadosOrdem(clienteId))))
                .andExpect(status().isCreated())
                .andReturn();
        return mapper.readTree(resultado.getResponse().getContentAsString());
    }

    private Map<String, Object> dadosOrdem(String clienteId) {
        Map<String, Object> dados = new LinkedHashMap<>();
        dados.put("clienteId", clienteId);
        dados.put("descricaoServico", "Ajuste de vestido");
        dados.put("valor", new BigDecimal("120.00"));
        dados.put("dataEntrada", "2026-01-10");
        dados.put("dataPrevistaEntrega", "2026-01-15");
        return dados;
    }
}
