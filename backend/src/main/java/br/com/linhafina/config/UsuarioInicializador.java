package br.com.linhafina.config;

import br.com.linhafina.model.Papel;
import br.com.linhafina.model.Usuario;
import br.com.linhafina.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class UsuarioInicializador implements ApplicationRunner {

    private final UsuarioRepository repository;
    private final PasswordEncoder encoder;
    private final String email;
    private final String senha;
    private final String nome;

    public UsuarioInicializador(
            UsuarioRepository repository,
            PasswordEncoder encoder,
            @Value("${APP_ADMIN_EMAIL:}") String email,
            @Value("${APP_ADMIN_PASSWORD:}") String senha,
            @Value("${APP_ADMIN_NAME:Administracao}") String nome) {
        this.repository = repository;
        this.encoder = encoder;
        this.email = email;
        this.senha = senha;
        this.nome = nome;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (repository.count() > 0 || email.isBlank() || senha.isBlank()) {
            return;
        }
        Usuario admin = new Usuario(nome, email.trim(), encoder.encode(senha), Papel.DONO);
        repository.save(admin);
    }
}
