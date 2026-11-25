package br.com.linhafina.service;

import br.com.linhafina.dto.LoginRequest;
import br.com.linhafina.dto.UsuarioResponse;
import br.com.linhafina.model.Usuario;
import br.com.linhafina.repository.UsuarioRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import java.util.ArrayList;
import java.util.List;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AutenticacaoService {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecurityContextRepository contextRepository;

    public AutenticacaoService(UsuarioRepository usuarioRepository, PasswordEncoder passwordEncoder,
                               SecurityContextRepository contextRepository) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.contextRepository = contextRepository;
    }

    @Transactional(readOnly = true)
    public UsuarioResponse entrar(LoginRequest request, HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        Usuario usuario = autenticar(request.getEmail(), request.getSenha());

        List<SimpleGrantedAuthority> autoridades = new ArrayList<>();
        autoridades.add(new SimpleGrantedAuthority("ROLE_" + usuario.getPapel().name()));

        UsernamePasswordAuthenticationToken autenticacao =
                new UsernamePasswordAuthenticationToken(usuario.getEmail(), null, autoridades);
        SecurityContext contexto = SecurityContextHolder.createEmptyContext();
        contexto.setAuthentication(autenticacao);
        SecurityContextHolder.setContext(contexto);

        httpRequest.getSession(true);
        contextRepository.saveContext(contexto, httpRequest, httpResponse);
        return new UsuarioResponse(usuario);
    }

    @Transactional(readOnly = true)
    public UsuarioResponse sessaoAtual() {
        Authentication autenticacao = SecurityContextHolder.getContext().getAuthentication();
        if (autenticacao == null || !autenticacao.isAuthenticated()
                || "anonymousUser".equals(autenticacao.getPrincipal())) {
            throw new BadCredentialsException("Sessao nao autenticada.");
        }

        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(autenticacao.getName());
        if (usuario == null || !usuario.getAtivo()) {
            throw new BadCredentialsException("Sessao nao autenticada.");
        }
        return new UsuarioResponse(usuario);
    }

    public void sair(HttpServletRequest request) {
        HttpSession sessao = request.getSession(false);
        if (sessao != null) {
            sessao.invalidate();
        }
        SecurityContextHolder.clearContext();
    }

    private Usuario autenticar(String email, String senha) {
        String emailParaBuscar = "";
        if (email != null) {
            emailParaBuscar = email.trim();
        }

        Usuario usuario = usuarioRepository.findByEmailIgnoreCase(emailParaBuscar);
        if (usuario == null || !usuario.getAtivo()) {
            throw new BadCredentialsException("E-mail ou senha invalidos.");
        }
        if (!passwordEncoder.matches(senha, usuario.getSenhaHash())) {
            throw new BadCredentialsException("E-mail ou senha invalidos.");
        }
        return usuario;
    }
}
