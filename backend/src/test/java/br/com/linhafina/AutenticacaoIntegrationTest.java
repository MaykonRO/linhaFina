package br.com.linhafina;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import br.com.linhafina.model.Papel;
import br.com.linhafina.model.Usuario;
import br.com.linhafina.repository.UsuarioRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@SpringBootTest
@AutoConfigureMockMvc
class AutenticacaoIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired UsuarioRepository usuarios;
    @Autowired PasswordEncoder encoder;

    @BeforeEach
    void prepararUsuario() {
        usuarios.deleteAll();
        usuarios.save(new Usuario("Admin Teste", "admin@teste.local", encoder.encode("senha-teste"), Papel.DONO));
    }

    @Test
    void deveEntrarRestaurarSessaoESair() throws Exception {
        mvc.perform(get("/api/clientes")).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/autenticacao/entrar").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@teste.local\",\"senha\":\"senha-errada\"}"))
                .andExpect(status().isUnauthorized());

        MvcResult resultado = mvc.perform(post("/api/autenticacao/entrar").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"admin@teste.local\",\"senha\":\"senha-teste\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.papel").value("dono"))
                .andExpect(jsonPath("$.nome").value("Admin Teste"))
                .andReturn();
        MockHttpSession sessao = (MockHttpSession) resultado.getRequest().getSession(false);

        mvc.perform(get("/api/autenticacao/sessao").session(sessao))
                .andExpect(status().isOk()).andExpect(jsonPath("$.email").value("admin@teste.local"));
        mvc.perform(get("/api/clientes").session(sessao)).andExpect(status().isOk());
        mvc.perform(post("/api/autenticacao/sair").session(sessao)).andExpect(status().isNoContent());
        mvc.perform(get("/api/autenticacao/sessao")).andExpect(status().isUnauthorized());
    }

    @Test
    void papelSemPermissaoNaoPodeExcluir() throws Exception {
        mvc.perform(delete("/api/clientes/{id}", 999).with(user("atendimento@teste.local").roles("ATENDIMENTO")))
                .andExpect(status().isForbidden());
    }

    @Test
    void senhaDeveEstarComHashNoBanco() {
        String hash = usuarios.findByEmailIgnoreCase("admin@teste.local").orElseThrow().getSenhaHash();
        org.assertj.core.api.Assertions.assertThat(hash).startsWith("$2");
        org.assertj.core.api.Assertions.assertThat(hash).isNotEqualTo("senha-teste");
    }
}
