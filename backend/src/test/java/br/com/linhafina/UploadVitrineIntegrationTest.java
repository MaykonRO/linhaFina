package br.com.linhafina;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.anonymous;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.linhafina.model.PecaVitrine;
import br.com.linhafina.repository.PecaVitrineRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest(properties = "atelie.upload-diretorio=target/test-uploads")
@AutoConfigureMockMvc
@WithMockUser(username = "admin@teste.local", roles = "DONO")
class UploadVitrineIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired PecaVitrineRepository pecas;

    @BeforeEach
    void limpar() {
        pecas.deleteAll();
    }

    @Test
    void deveSalvarServirERemoverImagemReal() throws Exception {
        PecaVitrine peca = new PecaVitrine();
        peca.setNome("Peca com foto");
        peca.setCategoria("Vestidos");
        peca.setDescricao("Teste");
        peca.setPreco(new BigDecimal("100"));
        peca = pecas.save(peca);
        MockMultipartFile arquivo = new MockMultipartFile("arquivo", "foto.png", "image/png", new byte[]{1, 2, 3, 4});

        MvcResult resultado = mvc.perform(multipart("/api/vitrine/pecas/{id}/imagem", peca.getId()).file(arquivo))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imagemUrl").isNotEmpty())
                .andReturn();
        String url = mapper.readTree(resultado.getResponse().getContentAsString()).get("imagemUrl").asText();
        mvc.perform(get(url).with(anonymous()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG))
                .andExpect(content().bytes(new byte[]{1, 2, 3, 4}));
        String nome = url.substring(url.lastIndexOf('/') + 1);
        Path caminho = Path.of("target/test-uploads").toAbsolutePath().resolve(nome);
        assertThat(caminho).exists();
        mvc.perform(delete("/api/vitrine/pecas/{id}", peca.getId())).andExpect(status().isNoContent());
        assertThat(caminho).doesNotExist();
    }

    @Test
    void deveRejeitarTipoInvalidoEAcessoSemLogin() throws Exception {
        PecaVitrine peca = new PecaVitrine();
        peca.setNome("Peca upload");
        peca.setCategoria("Vestidos");
        peca.setDescricao("Teste");
        peca.setPreco(BigDecimal.TEN);
        peca = pecas.save(peca);
        MockMultipartFile texto = new MockMultipartFile("arquivo", "texto.txt", "text/plain", "texto".getBytes());
        mvc.perform(multipart("/api/vitrine/pecas/{id}/imagem", peca.getId()).file(texto))
                .andExpect(status().isUnprocessableEntity());
        mvc.perform(multipart("/api/vitrine/pecas/{id}/imagem", peca.getId()).file(texto).with(anonymous()))
                .andExpect(status().isUnauthorized());
    }
}
