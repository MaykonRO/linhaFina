package br.com.linhafina.repository;

import br.com.linhafina.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Usuario findByEmailIgnoreCase(String email);
}
