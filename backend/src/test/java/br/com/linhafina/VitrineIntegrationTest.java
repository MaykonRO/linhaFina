package br.com.linhafina;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.linhafina.repository.PecaVitrineRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
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
class VitrineIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired PecaVitrineRepository pecas;

    @BeforeEach
    void limpar() {
        pecas.deleteAll();
    }

    @Test
    void deveExecutarCrudAlternarExibicaoEFiltrarGaleriaPublica() throws Exception {
        String ativa = criar("Peca Publica", true).get("id").asText();
        criar("Peca Oculta", false);

        mvc.perform(get("/api/vitrine/pecas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2));
        mvc.perform(get("/api/vitrine/publica").with(anonymous()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].nome").value("Peca Publica"));

        mvc.perform(post("/api/vitrine/pecas/{id}/alternar-destaque", ativa))
                .andExpect(status().isOk()).andExpect(jsonPath("$.destaque").value(true));
        mvc.perform(post("/api/vitrine/pecas/{id}/alternar-exibicao", ativa))
                .andExpect(status().isOk()).andExpect(jsonPath("$.ativo").value(false));
        mvc.perform(get("/api/vitrine/publica").with(anonymous()))
                .andExpect(jsonPath("$.length()").value(0));
        mvc.perform(delete("/api/vitrine/pecas/{id}", ativa)).andExpect(status().isNoContent());
    }

    @Test
    void administracaoNaoPodeSerLidaSemLogin() throws Exception {
        mvc.perform(get("/api/vitrine/pecas").with(anonymous())).andExpect(status().isUnauthorized());
    }

    private JsonNode criar(String nome, boolean ativo) throws Exception {
        String json = "{\"nome\":\"" + nome + "\",\"categoria\":\"Vestidos\",\"descricao\":\"Peca de teste\",\"preco\":100,"
                + "\"arte\":\"vestido-longo\",\"destaque\":false,\"ativo\":" + ativo + "}";
        MvcResult result = mvc.perform(post("/api/vitrine/pecas").contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isCreated()).andReturn();
        return mapper.readTree(result.getResponse().getContentAsString());
    }
}
